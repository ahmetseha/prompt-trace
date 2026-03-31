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
const IS_WIN = process.platform === "win32";

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

// --- Port detection ---
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.listen(startPort, () => { srv.close(() => resolve(startPort)); });
    srv.on("error", () => resolve(findFreePort(startPort + 1)));
  });
}

// --- Cross-platform shell exec (handles spaces in paths) ---
function run(cmd, cwd, stdio) {
  execSync(cmd, { cwd, stdio, shell: true });
}

function openBrowser(url) {
  try {
    if (IS_WIN) {
      execSync(`start "" "${url}"`, { stdio: "ignore", shell: true });
    } else if (process.platform === "darwin") {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: "ignore" });
    }
  } catch { /* ignore */ }
}

function nextBin() {
  return JSON.stringify(join(APP_DIR, "node_modules", ".bin", "next"));
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
console.log("  PromptTrace v0.2.9");
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

  mkdirSync(APP_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  const standaloneDir = join(pkgRoot, ".next", "standalone");
  const staticDir = join(pkgRoot, ".next", "static");

  if (existsSync(standaloneDir)) {
    cpSync(standaloneDir, APP_DIR, { recursive: true, force: true });
    const destStatic = join(APP_DIR, ".next", "static");
    if (existsSync(staticDir)) {
      mkdirSync(dirname(destStatic), { recursive: true });
      cpSync(staticDir, destStatic, { recursive: true, force: true });
    }
  } else {
    // Clean old artifacts
    for (const p of ["node_modules", ".next", "package-lock.json"]) {
      const target = join(APP_DIR, p);
      if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    }

    // Copy source
    for (const dir of ["src", "docs"]) {
      const src = join(pkgRoot, dir);
      if (existsSync(src)) cpSync(src, join(APP_DIR, dir), { recursive: true, force: true });
    }
    for (const file of ["package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs", "next-env.d.ts"]) {
      const src = join(pkgRoot, file);
      if (existsSync(src)) cpSync(src, join(APP_DIR, file), { force: true });
    }
    mkdirSync(join(APP_DIR, "public"), { recursive: true });

    console.log(" installing deps...");
    run("npm install --no-audit --no-fund 2>&1", APP_DIR, ["ignore", "ignore", "inherit"]);

    process.stdout.write("  Building dashboard...");
    run(`${nextBin()} build`, APP_DIR, ["ignore", "ignore", "inherit"]);
  }

  writeFileSync(versionFile, currentVersion);
  console.log(" done.");
  console.log("");
}

// Ensure data dir
mkdirSync(DATA_DIR, { recursive: true });

const dbPath = join(DATA_DIR, "prompttrace.db");

// --- Determine server command ---
const standaloneServer = join(APP_DIR, "server.js");
const useStandalone = existsSync(standaloneServer);

const serverCmd = useStandalone
  ? `${JSON.stringify(process.execPath)} ${JSON.stringify(standaloneServer)}`
  : `${nextBin()} start -p ${port}`;

const serverEnv = {
  ...process.env,
  PORT: port,
  HOSTNAME: "0.0.0.0",
  NODE_ENV: "production",
};

// --- Scan only mode ---
if (scanOnly) {
  process.stdout.write("  Starting server for scanning...");
  const srv = spawn(serverCmd, { cwd: APP_DIR, stdio: "ignore", shell: true, detached: true, env: serverEnv });
  await waitForServer(port, 20000);
  console.log(" ready.");
  await runIngest(port);
  try { process.kill(-srv.pid); } catch { srv.kill(); }
  console.log("  Done.");
  process.exit(0);
}

// --- Start server ---
const server = spawn(serverCmd, {
  cwd: APP_DIR,
  stdio: ["ignore", "pipe", "inherit"],
  shell: true,
  env: serverEnv,
});

server.stdout?.on("data", () => {});

// Scan, then open browser
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
  console.log("");
  console.log("  Press Ctrl+C to stop");
  console.log("");

  if (!noOpen) openBrowser(`http://localhost:${port}`);
})();

server.on("close", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => { server.kill(); process.exit(0); });
process.on("SIGTERM", () => { server.kill(); process.exit(0); });

// --- Helpers ---

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
    console.log("  No AI histories found. Dashboard will show demo data.");
  }
  console.log("");
}
