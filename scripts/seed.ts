import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/lib/db/schema';
import {
  demoSources,
  demoProjects,
  demoSessions,
  demoPrompts,
  demoPromptFiles,
  demoPromptTags,
  demoTemplates,
} from '../src/lib/demo/data';
import { runMigrations } from '../src/lib/db/migrate';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'prompttrace.db');

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Delete existing database for a clean seed
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Deleted existing database');
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Run migrations
runMigrations(sqlite);
console.log('Migrations complete');

const db = drizzle(sqlite, { schema });

// Use a transaction for fast bulk insert
sqlite.transaction(() => {
  console.log('Seeding sources...');
  for (const source of demoSources) {
    db.insert(schema.sources).values(source).run();
  }

  console.log('Seeding projects...');
  for (const project of demoProjects) {
    db.insert(schema.projects).values(project).run();
  }

  console.log('Seeding sessions...');
  for (const session of demoSessions) {
    db.insert(schema.sessions).values(session).run();
  }

  console.log('Seeding prompts...');
  for (const prompt of demoPrompts) {
    db.insert(schema.prompts).values(prompt).run();
  }

  console.log('Seeding prompt files...');
  for (const pf of demoPromptFiles) {
    db.insert(schema.promptFiles).values(pf).run();
  }

  console.log('Seeding prompt tags...');
  for (const pt of demoPromptTags) {
    db.insert(schema.promptTags).values(pt).run();
  }

  console.log('Seeding template candidates...');
  for (const tc of demoTemplates) {
    db.insert(schema.templateCandidates).values(tc).run();
  }
})();

console.log(
  `\nSeed complete:\n` +
  `  ${demoSources.length} sources\n` +
  `  ${demoProjects.length} projects\n` +
  `  ${demoSessions.length} sessions\n` +
  `  ${demoPrompts.length} prompts\n` +
  `  ${demoPromptFiles.length} prompt files\n` +
  `  ${demoPromptTags.length} prompt tags\n` +
  `  ${demoTemplates.length} template candidates`
);

sqlite.close();
