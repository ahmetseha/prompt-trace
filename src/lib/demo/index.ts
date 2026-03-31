export {
  demoSources,
  demoProjects,
  demoSessions,
  demoPrompts,
  demoPromptFiles,
  demoPromptTags,
  demoTemplates,
  getDemoStats,
} from './data';

/**
 * Check if the app is in demo mode.
 * Returns true when the database has no real data (0 prompts).
 */
export function isDemoMode(): boolean {
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');

    const dbPath = path.join(process.cwd(), 'data', 'prompttrace.db');
    if (!fs.existsSync(dbPath)) return true;

    const sqlite = new Database(dbPath, { readonly: true });
    const row = sqlite.prepare('SELECT COUNT(*) as cnt FROM prompts').get() as { cnt: number } | undefined;
    sqlite.close();

    return !row || row.cnt === 0;
  } catch {
    return true;
  }
}
