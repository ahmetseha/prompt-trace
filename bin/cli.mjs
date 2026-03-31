#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");

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
    --port <number>   Port to run on (default: 3001)
    --no-open         Don't open browser automatically
    --no-scan         Skip automatic source scanning
`);
  process.exit(0);
}

const port = args.includes("--port")
  ? args[args.indexOf("--port") + 1]
  : "3001";
const noOpen = args.includes("--no-open");
const noScan = args.includes("--no-scan");
const scanOnly = args[0] === "scan";

console.log("");
console.log("  PromptTrace v0.1.0");
console.log("  Local-first prompt intelligence for developers");
console.log("");

// Ensure dependencies are installed
const nodeModules = join(pkgRoot, "node_modules");
if (!existsSync(nodeModules)) {
  console.log("  Installing dependencies...");
  execSync("npm install --production --no-audit --no-fund", {
    cwd: pkgRoot,
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.log("  Dependencies installed.");
  console.log("");
}

// Ensure data directory exists
const dataDir = join(pkgRoot, "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "prompttrace.db");
const isFirstRun = !existsSync(dbPath);

// Build if .next doesn't exist
const nextDir = join(pkgRoot, ".next");
if (!existsSync(nextDir)) {
  console.log("  Building dashboard (first time only)...");
  execSync("npx next build", { cwd: pkgRoot, stdio: ["ignore", "ignore", "inherit"] });
  console.log("  Build complete.");
  console.log("");
}

if (scanOnly) {
  // Just scan and exit
  console.log("  Starting temporary server for scanning...");
  const srv = spawn("npx", ["next", "start", "-p", port], {
    cwd: pkgRoot,
    stdio: "ignore",
    shell: true,
    detached: true,
  });

  // Wait for server to be ready
  await waitForServer(port, 15000);
  await runIngest(port);

  srv.kill();
  console.log("  Done.");
  process.exit(0);
}

// Start the server
console.log(`  Dashboard: http://localhost:${port}`);
console.log("  Press Ctrl+C to stop");
console.log("");

const server = spawn("npx", ["next", "start", "-p", port], {
  cwd: pkgRoot,
  stdio: "inherit",
  shell: true,
});

// Auto-scan on first run
if (isFirstRun && !noScan) {
  (async () => {
    await waitForServer(port, 15000);
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

// --- helpers ---

async function waitForServer(p, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${p}/api/stats`);
      if (res.ok) return;
    } catch {
      // not ready yet
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
