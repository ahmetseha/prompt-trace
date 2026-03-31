#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const args = process.argv.slice(2);
const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : '3001';

console.log('');
console.log('  PromptTrace v0.1.0');
console.log('  Local-first prompt intelligence for developers');
console.log('');

// Ensure data directory exists
const dataDir = join(root, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Auto-discover and ingest sources on first run
const dbPath = join(dataDir, 'prompttrace.db');
const isFirstRun = !existsSync(dbPath);

if (isFirstRun) {
  console.log('  First run detected. Scanning AI tool histories...');
  console.log('');
}

// Build if needed
const nextDir = join(root, '.next');
if (!existsSync(nextDir)) {
  console.log('  Building dashboard...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
  console.log('');
}

// Start the server
console.log(`  Starting dashboard on http://localhost:${port}`);
console.log('  Press Ctrl+C to stop');
console.log('');

const server = spawn('npx', ['next', 'start', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

// Auto-ingest on first run after server starts
if (isFirstRun) {
  setTimeout(async () => {
    try {
      console.log('  Scanning Claude Code history...');
      const r1 = await fetch(`http://localhost:${port}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'claude-code' }),
      });
      const d1 = await r1.json();
      if (d1.promptsIngested > 0) {
        console.log(`  Found ${d1.promptsIngested} prompts from ${d1.projectsFound} projects`);
      }

      console.log('  Scanning Cursor history...');
      const r2 = await fetch(`http://localhost:${port}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'cursor' }),
      });
      const d2 = await r2.json();
      if (d2.promptsIngested > 0) {
        console.log(`  Found ${d2.promptsIngested} prompts from ${d2.projectsFound} projects`);
      }

      const total = (d1.promptsIngested || 0) + (d2.promptsIngested || 0);
      if (total > 0) {
        console.log(`  Total: ${total} prompts ingested`);
      } else {
        console.log('  No AI tool histories found. Using demo data.');
      }
      console.log('');
    } catch {
      // Server might not be ready yet, user can scan manually
    }
  }, 3000);
}

// Open browser after a short delay
setTimeout(() => {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  try {
    execSync(`${cmd} http://localhost:${port}`, { stdio: 'ignore' });
  } catch {
    // Browser open failed, that's fine
  }
}, 2000);

server.on('close', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
  process.exit(0);
});
