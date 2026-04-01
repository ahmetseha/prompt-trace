#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const HOME = process.env.HOME || process.env.USERPROFILE || "~";
const APP_DIR = join(HOME, ".prompttrace");
const DATA_DIR = join(APP_DIR, "data");

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
    --no-cache        Force full rescan of all sources
`);
  process.exit(0);
}

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.listen(startPort, () => { srv.close(() => resolve(startPort)); });
    srv.on("error", () => resolve(findFreePort(startPort + 1)));
  });
}

function openBrowser(url) {
  try {
    const IS_WIN = process.platform === "win32";
    if (IS_WIN) {
      execSync(`start "" "${url}"`, { stdio: "ignore", shell: true });
    } else if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch { /* ignore */ }
}

const requestedPort = args.includes("--port")
  ? parseInt(args[args.indexOf("--port") + 1], 10)
  : 3001;
const port = String(await findFreePort(requestedPort));
const noOpen = args.includes("--no-open");
const noScan = args.includes("--no-scan");
const noCache = args.includes("--no-cache");
const scanOnly = args[0] === "scan";

console.log("");
console.log("  PromptTrace v1.0.1");
console.log("  Local-first prompt intelligence for developers");
console.log("");

// --- Setup ~/.prompttrace ---
const pkgJson = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf-8"));
const versionFile = join(APP_DIR, ".version");
const currentVersion = pkgJson.version;
const installedVersion = existsSync(versionFile)
  ? readFileSync(versionFile, "utf-8").trim()
  : null;

const needsSetup = !existsSync(APP_DIR) || installedVersion !== currentVersion;

if (needsSetup) {
  const action = installedVersion ? `Updating ${installedVersion} -> ${currentVersion}` : "Setting up";
  process.stdout.write(`  ${action}...`);

  // Clean old install
  if (existsSync(APP_DIR)) {
    for (const p of ["node_modules", "dist", ".next", "package-lock.json"]) {
      const target = join(APP_DIR, p);
      if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    }
  }

  mkdirSync(APP_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  // Copy source files
  for (const dir of ["src", "server", "scripts"]) {
    const src = join(pkgRoot, dir);
    if (existsSync(src)) cpSync(src, join(APP_DIR, dir), { recursive: true, force: true });
  }
  for (const file of ["package.json", "tsconfig.json", "tsconfig.server.json", "vite.config.ts", "postcss.config.mjs", "index.html"]) {
    const src = join(pkgRoot, file);
    if (existsSync(src)) cpSync(src, join(APP_DIR, file), { force: true });
  }

  // Copy pre-built dist if available
  const distDir = join(pkgRoot, "dist");
  if (existsSync(distDir)) {
    cpSync(distDir, join(APP_DIR, "dist"), { recursive: true, force: true });
  }

  mkdirSync(join(APP_DIR, "public"), { recursive: true });

  console.log(" installing deps...");
  execSync("npm install --no-audit --no-fund", {
    cwd: APP_DIR,
    stdio: ["ignore", "ignore", "inherit"],
    shell: true,
  });

  // Build frontend if not pre-built
  if (!existsSync(join(APP_DIR, "dist", "index.html"))) {
    process.stdout.write("  Building dashboard...");
    execSync("npx vite build", {
      cwd: APP_DIR,
      stdio: ["ignore", "ignore", "inherit"],
      shell: true,
    });
    console.log(" done.");
  }

  writeFileSync(versionFile, currentVersion);
  console.log("  Ready.");
  console.log("");
}

mkdirSync(DATA_DIR, { recursive: true });
const dbPath = join(DATA_DIR, "prompttrace.db");

// --- Start server ---
const serverEnv = { ...process.env, PORT: port, NODE_ENV: "production" };

if (scanOnly) {
  process.stdout.write("  Starting server for scanning...");
  const srv = spawn("npx", ["tsx", "server/index.ts"], {
    cwd: APP_DIR, stdio: "ignore", shell: true, detached: true, env: serverEnv,
  });
  await waitForServer(port, 20000);
  console.log(" ready.");
  await runIngest(port);
  try { process.kill(-srv.pid); } catch { srv.kill(); }
  console.log("  Done.");
  process.exit(0);
}

const server = spawn("npx", ["tsx", "server/index.ts"], {
  cwd: APP_DIR, stdio: ["ignore", "pipe", "inherit"], shell: true, env: serverEnv,
});
server.stdout?.on("data", () => {});

(async () => {
  await waitForServer(port, 20000);

  if (!noScan) {
    if (noCache && existsSync(dbPath)) {
      for (const f of [dbPath, dbPath + "-shm", dbPath + "-wal"]) {
        if (existsSync(f)) rmSync(f, { force: true });
      }
    }
    await runIngest(port);
  }

  console.log(`  Dashboard ready at http://localhost:${port}`);
  console.log("  Press Ctrl+C to stop");
  console.log("");

  if (!noOpen) openBrowser(`http://localhost:${port}`);
})();

server.on("close", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => { server.kill(); process.exit(0); });
process.on("SIGTERM", () => { server.kill(); process.exit(0); });

async function waitForServer(p, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${p}/api/stats`);
      if (res.ok) return;
    } catch { /* not ready */ }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function runIngest(p) {
  const sources = ["claude-code", "cursor", "codex-cli"];
  let total = 0;
  for (const src of sources) {
    try {
      const label = { "claude-code": "Claude Code", cursor: "Cursor", "codex-cli": "Codex CLI" }[src] || src;
      process.stdout.write(`  Scanning ${label}... `);
      const res = await fetch(`http://localhost:${p}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: src }),
      });
      const data = await res.json();
      if (data.promptsIngested > 0) {
        console.log(`${data.promptsIngested} prompts from ${data.projectsFound} projects`);
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
    console.log("  No AI histories found.");
  }
  console.log("");
}
