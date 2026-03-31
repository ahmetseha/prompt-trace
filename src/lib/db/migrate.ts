import type Database from 'better-sqlite3';

const CREATE_SOURCES = `
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'idle',
  last_scanned_at INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);`;

const CREATE_PROJECTS = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  first_seen_at INTEGER,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);`;

const CREATE_SESSIONS = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT REFERENCES sources(id),
  project_id TEXT REFERENCES projects(id),
  external_session_id TEXT,
  title TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  model_summary_json TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);`;

const CREATE_PROMPTS = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT REFERENCES sources(id),
  project_id TEXT REFERENCES projects(id),
  session_id TEXT REFERENCES sessions(id),
  timestamp INTEGER,
  prompt_text TEXT,
  response_preview TEXT,
  model TEXT,
  prompt_length INTEGER,
  category TEXT,
  intent TEXT,
  token_estimate INTEGER,
  cost_estimate REAL,
  success_score REAL,
  reuse_score REAL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);`;

const CREATE_PROMPT_FILES = `
CREATE TABLE IF NOT EXISTS prompt_files (
  id TEXT PRIMARY KEY NOT NULL,
  prompt_id TEXT NOT NULL REFERENCES prompts(id),
  file_path TEXT NOT NULL,
  action_type TEXT,
  created_at INTEGER NOT NULL
);`;

const CREATE_PROMPT_TAGS = `
CREATE TABLE IF NOT EXISTS prompt_tags (
  id TEXT PRIMARY KEY NOT NULL,
  prompt_id TEXT NOT NULL REFERENCES prompts(id),
  tag TEXT NOT NULL
);`;

const CREATE_TEMPLATE_CANDIDATES = `
CREATE TABLE IF NOT EXISTS template_candidates (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  normalized_pattern TEXT,
  description TEXT,
  source_prompt_ids_json TEXT,
  reuse_score REAL,
  category TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);`;

const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_sessions_source_id ON sessions(source_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_source_id ON prompts(source_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_session_id ON prompts(session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_timestamp ON prompts(timestamp);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);`,
  `CREATE INDEX IF NOT EXISTS idx_prompt_files_prompt_id ON prompt_files(prompt_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);`,
  `CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags(tag);`,
];

const MIGRATIONS = [
  CREATE_SOURCES,
  CREATE_PROJECTS,
  CREATE_SESSIONS,
  CREATE_PROMPTS,
  CREATE_PROMPT_FILES,
  CREATE_PROMPT_TAGS,
  CREATE_TEMPLATE_CANDIDATES,
  ...CREATE_INDEXES,
];

export function runMigrations(sqlite: Database.Database): void {
  sqlite.pragma('foreign_keys = ON');

  sqlite.transaction(() => {
    for (const statement of MIGRATIONS) {
      sqlite.exec(statement);
    }
  })();
}
