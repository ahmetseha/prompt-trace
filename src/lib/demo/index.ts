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
 * Returns true when the database has no real data (0 prompts),
 * indicating we should fall back to demo/seed data.
 */
export function isDemoMode(): boolean {
  try {
    // Dynamic import to avoid circular dependency issues at module level.
    // This is intentionally synchronous via require so it can be called
    // in both server components and API routes without async overhead.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require('@/lib/db');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prompts } = require('@/lib/db/schema');
    const { count } = require('drizzle-orm');

    const result = db.select({ value: count() }).from(prompts).get();
    return !result || result.value === 0;
  } catch {
    // If the database doesn't exist yet, we're in demo mode
    return true;
  }
}

/**
 * Return all demo data as a single object, convenient for seeding.
 */
export function getDemoData() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require('./data');
  return {
    sources: data.demoSources,
    projects: data.demoProjects,
    sessions: data.demoSessions,
    prompts: data.demoPrompts,
    promptFiles: data.demoPromptFiles,
    promptTags: data.demoPromptTags,
    templateCandidates: data.demoTemplates,
  };
}
