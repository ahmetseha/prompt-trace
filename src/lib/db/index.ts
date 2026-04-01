import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { runMigrations } from './migrate';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'prompttrace.db');

function createDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');

  // Run migrations to ensure all tables exist
  runMigrations(sqlite);

  // Clean legacy data: remove sources with random UUID IDs (from old versions)
  try {
    const oldSources = sqlite.prepare("SELECT id FROM sources WHERE id NOT LIKE 'src-%'").all() as { id: string }[];
    if (oldSources.length > 0) {
      for (const { id } of oldSources) {
        const oldPromptIds = sqlite.prepare("SELECT id FROM prompts WHERE source_id = ?").all(id) as { id: string }[];
        for (const { id: pid } of oldPromptIds) {
          sqlite.prepare("DELETE FROM prompt_files WHERE prompt_id = ?").run(pid);
          sqlite.prepare("DELETE FROM prompt_tags WHERE prompt_id = ?").run(pid);
        }
        sqlite.prepare("DELETE FROM prompts WHERE source_id = ?").run(id);
        sqlite.prepare("DELETE FROM sessions WHERE source_id = ?").run(id);
        sqlite.prepare("DELETE FROM sources WHERE id = ?").run(id);
      }
      // Also clean orphan projects
      sqlite.prepare("DELETE FROM projects WHERE id NOT IN (SELECT DISTINCT project_id FROM sessions WHERE project_id IS NOT NULL)").run();
      // Clean old unknown categories -> reclassify on next scan
      sqlite.prepare("UPDATE prompts SET category = 'general' WHERE category = 'unknown'").run();
    }
  } catch { /* ignore cleanup errors */ }

  return drizzle(sqlite, { schema });
}

// Use a global to prevent multiple instances in dev (Next.js hot-reload)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export function getDb() {
  return db;
}

export type DbClient = typeof db;
