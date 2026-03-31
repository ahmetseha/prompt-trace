#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const HOME = process.env.HOME || process.env.USERPROFILE || "~";
const APP_DIR = join(HOME, ".prompttrace");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  prompttrace - Local-first prompt intelligence for developers

  Usage:
    npx prompttrace              Start the dashboard
    npx prompttrace --port 3002  Use a custom port
    npx prompttrace scan         Scan sources without starting dashboard
    npx prompttrace --help       Show this help

  Options:
    --port <number>   Port to run on (default: auto-detect free port)
    --no-open         Don't open browser automatically
    --no-scan         Skip automatic source scanning
`);
  process.exit(0);
}

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.listen(startPort, () => {
      srv.close(() => resolve(startPort));
    });
    srv.on("error", () => resolve(findFreePort(startPort + 1)));
  });
}

const requestedPort = args.includes("--port")
  ? parseInt(args[args.indexOf("--port") + 1], 10)
  : 3001;
const port = String(await findFreePort(requestedPort));
const noOpen = args.includes("--no-open");
const noScan = args.includes("--no-scan");
const scanOnly = args[0] === "scan";

console.log("");
console.log("  PromptTrace v0.1.2");
console.log("  Local-first prompt intelligence for developers");
console.log("");

// --- Setup app in ~/.prompttrace ---
const pkgJson = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf-8"));
const versionFile = join(APP_DIR, ".version");
const currentVersion = pkgJson.version;
const installedVersion = existsSync(versionFile)
  ? readFileSync(versionFile, "utf-8").trim()
  : null;

const needsInstall = !existsSync(APP_DIR) || installedVersion !== currentVersion;

if (needsInstall) {
  console.log(
    installedVersion
      ? `  Updating ${installedVersion} -> ${currentVersion}...`
      : "  Setting up PromptTrace..."
  );

  // Copy source files to ~/.prompttrace
  mkdirSync(APP_DIR, { recursive: true });

  const copyDirs = ["src", "scripts", "bin", "docs"];
  const copyFiles = [
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
    "next-env.d.ts",
    "drizzle.config.ts",
  ];

  for (const dir of copyDirs) {
    const src = join(pkgRoot, dir);
    if (existsSync(src)) {
      cpSync(src, join(APP_DIR, dir), { recursive: true, force: true });
    }
  }

  for (const file of copyFiles) {
    const src = join(pkgRoot, file);
    if (existsSync(src)) {
      cpSync(src, join(APP_DIR, file), { force: true });
    }
  }

  // Ensure public dir exists (Next.js expects it)
  mkdirSync(join(APP_DIR, "public"), { recursive: true });

  // Remove package-lock.json to avoid lockfile conflicts
  const lockFile = join(APP_DIR, "package-lock.json");
  if (existsSync(lockFile)) {
    const { unlinkSync } = await import("fs");
    unlinkSync(lockFile);
  }

  console.log("  Installing dependencies...");
  execSync("npm install --omit=dev --no-audit --no-fund", {
    cwd: APP_DIR,
    stdio: ["ignore", "ignore", "inherit"],
  });

  // Write version marker
  writeFileSync(versionFile, currentVersion);
  console.log("  Setup complete.");
  console.log("");
}

// Ensure data directory
const dataDir = join(APP_DIR, "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, "prompttrace.db");
const isFirstRun = !existsSync(dbPath);

// Build if needed
const nextDir = join(APP_DIR, ".next");
if (!existsSync(nextDir) || needsInstall) {
  console.log("  Building dashboard...");
  execSync(
    `${process.execPath} ${join(APP_DIR, "node_modules", ".bin", "next")} build`,
    { cwd: APP_DIR, stdio: ["ignore", "ignore", "inherit"] }
  );
  console.log("  Build complete.");
  console.log("");
}

// --- Scan only mode ---
if (scanOnly) {
  console.log("  Starting temporary server for scanning...");
  const srv = spawn(
    process.execPath,
    [join(APP_DIR, "node_modules", ".bin", "next"), "start", "-p", port],
    { cwd: APP_DIR, stdio: "ignore", detached: true }
  );
  await waitForServer(port, 20000);
  await runIngest(port);
  srv.kill();
  console.log("  Done.");
  process.exit(0);
}

// --- Start server ---
console.log(`  Dashboard: http://localhost:${port}`);
console.log("  Press Ctrl+C to stop");
console.log("");

const server = spawn(
  process.execPath,
  [join(APP_DIR, "node_modules", ".bin", "next"), "start", "-p", port],
  { cwd: APP_DIR, stdio: "inherit" }
);

// Auto-scan on first run
if (isFirstRun && !noScan) {
  (async () => {
    await waitForServer(port, 20000);
    await runIngest(port);
  })();
}

// Open browser
if (!noOpen) {
  setTimeout(() => {
    const cmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    try {
      execSync(`${cmd} http://localhost:${port}`, { stdio: "ignore" });
    } catch {
      // ignore
    }
  }, 3000);
}

server.on("close", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});

// --- Helpers ---

async function waitForServer(p, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${p}/api/stats`);
      if (res.ok) return;
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function runIngest(p) {
  const sources = ["claude-code", "cursor"];
  let total = 0;

  for (const src of sources) {
    try {
      const label = src === "claude-code" ? "Claude Code" : "Cursor";
      process.stdout.write(`  Scanning ${label}... `);
      const res = await fetch(`http://localhost:${p}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: src }),
      });
      const data = await res.json();
      if (data.promptsIngested > 0) {
        console.log(
          `${data.promptsIngested} prompts from ${data.projectsFound} projects`
        );
        total += data.promptsIngested;
      } else {
        console.log("no history found");
      }
    } catch {
      console.log("skipped");
    }
  }

  if (total > 0) {
    console.log(`  Total: ${total} prompts ingested`);
  } else {
    console.log("  No AI histories found. Dashboard will show demo data.");
  }
  console.log("");
}
