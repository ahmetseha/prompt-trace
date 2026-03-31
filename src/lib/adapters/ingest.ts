import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { IngestResult } from "./runner";
import { parseSource, transformParsedData } from "./runner";
import { getAdapter } from "./index";

/**
 * Ingest data from a source adapter into the database.
 *
 * Uses a deterministic source ID based on adapter type so re-scans
 * update existing data instead of creating duplicates.
 *
 * Strategy: delete all data for this source, then re-insert fresh.
 * This avoids duplicate detection complexity and ensures clean state.
 */
export async function ingestSource(
  sourceType: string,
  basePath?: string
): Promise<IngestResult> {
  const errors: string[] = [];
  const adapter = getAdapter(sourceType);

  if (!adapter) {
    return {
      sourceId: "",
      promptsIngested: 0,
      sessionsCreated: 0,
      projectsFound: 0,
      errors: [`Unknown adapter type: ${sourceType}`],
    };
  }

  // Deterministic source ID - same adapter always uses same ID
  const sourceId = `src-${sourceType}`;

  // 1. Parse raw data
  let parsed;
  try {
    parsed = await parseSource(sourceType, basePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      sourceId,
      promptsIngested: 0,
      sessionsCreated: 0,
      projectsFound: 0,
      errors: [`Parse failed: ${msg}`],
    };
  }

  if (parsed.length === 0) {
    return {
      sourceId,
      promptsIngested: 0,
      sessionsCreated: 0,
      projectsFound: 0,
      errors: [],
    };
  }

  // 2. Clean old data for this source (delete in FK order)
  try {
    // Get prompt IDs for this source to clean related tables
    const oldPrompts = db
      .select({ id: schema.prompts.id })
      .from(schema.prompts)
      .where(eq(schema.prompts.sourceId, sourceId))
      .all();
    const oldPromptIds = oldPrompts.map((p) => p.id);

    // Delete prompt files and tags for old prompts
    for (const pid of oldPromptIds) {
      db.delete(schema.promptFiles).where(eq(schema.promptFiles.promptId, pid)).run();
      db.delete(schema.promptTags).where(eq(schema.promptTags.promptId, pid)).run();
    }

    // Collect project IDs that belong to this source's sessions
    const oldSessions = db
      .select({ projectId: schema.sessions.projectId })
      .from(schema.sessions)
      .where(eq(schema.sessions.sourceId, sourceId))
      .all();
    const projectIds = new Set(oldSessions.map((s) => s.projectId).filter(Boolean));

    // Delete prompts, sessions for this source
    db.delete(schema.prompts).where(eq(schema.prompts.sourceId, sourceId)).run();
    db.delete(schema.sessions).where(eq(schema.sessions.sourceId, sourceId)).run();

    // Delete orphan projects (projects with no remaining sessions)
    for (const pid of projectIds) {
      if (!pid) continue;
      const remaining = db
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(eq(schema.sessions.projectId, pid))
        .all();
      if (remaining.length === 0) {
        db.delete(schema.projects).where(eq(schema.projects.id, pid)).run();
      }
    }

    // Delete the source itself (will be re-created)
    db.delete(schema.sources).where(eq(schema.sources.id, sourceId)).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Cleanup warning: ${msg}`);
  }

  // 3. Transform into DB entities
  const data = transformParsedData(parsed, sourceId);
  data.source.id = sourceId;
  data.source.name = adapter.name;
  data.source.type = adapter.type;

  // 4. Insert fresh data
  try {
    db.insert(schema.sources).values(data.source).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to insert source: ${msg}`);
  }

  // Projects - use upsert (same project can come from multiple sources)
  for (const project of data.projects) {
    try {
      db.insert(schema.projects).values(project).onConflictDoNothing().run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert project: ${msg}`);
    }
  }

  for (const session of data.sessions) {
    try {
      db.insert(schema.sessions).values(session).run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert session: ${msg}`);
    }
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < data.prompts.length; i += BATCH_SIZE) {
    const batch = data.prompts.slice(i, i + BATCH_SIZE);
    try {
      for (const p of batch) {
        db.insert(schema.prompts).values(p).run();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert prompts: ${msg}`);
    }
  }

  for (const pf of data.promptFiles) {
    try {
      db.insert(schema.promptFiles).values(pf).run();
    } catch (err) { /* skip duplicates */ }
  }

  for (const pt of data.promptTags) {
    try {
      db.insert(schema.promptTags).values(pt).run();
    } catch (err) { /* skip duplicates */ }
  }

  // 5. Refresh templates
  try {
    const allPrompts = db.select().from(schema.prompts).all();
    const { refreshTemplates } = await import("@/lib/templates");
    await refreshTemplates(allPrompts as import("@/lib/types").Prompt[]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Template refresh warning: ${msg}`);
  }

  return {
    sourceId,
    promptsIngested: data.prompts.length,
    sessionsCreated: data.sessions.length,
    projectsFound: data.projects.length,
    errors,
  };
}
