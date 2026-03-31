import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { IngestResult } from "./runner";
import { parseSource, transformParsedData } from "./runner";
import { getAdapter } from "./index";
import { generateId } from "@/lib/utils";

/**
 * Ingest data from a source adapter into the database.
 *
 * 1. Parses raw data from the filesystem via the adapter
 * 2. Transforms into database entities
 * 3. Inserts with conflict-safe upsert behavior
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

  // 1. Parse raw data
  let parsed;
  try {
    parsed = await parseSource(sourceType, basePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      sourceId: "",
      promptsIngested: 0,
      sessionsCreated: 0,
      projectsFound: 0,
      errors: [`Parse failed: ${msg}`],
    };
  }

  if (parsed.length === 0) {
    return {
      sourceId: "",
      promptsIngested: 0,
      sessionsCreated: 0,
      projectsFound: 0,
      errors: [],
    };
  }

  // 2. Transform into DB entities
  const sourceId = generateId();
  const data = transformParsedData(parsed, sourceId);

  // Update source with proper name/type from adapter
  data.source.name = adapter.name;
  data.source.type = adapter.type;

  // 3. Insert into database in order
  try {
    // Source
    await db
      .insert(schema.sources)
      .values(data.source)
      .onConflictDoNothing();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to insert source: ${msg}`);
  }

  // Projects
  for (const project of data.projects) {
    try {
      await db
        .insert(schema.projects)
        .values(project)
        .onConflictDoNothing();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert project ${project.name}: ${msg}`);
    }
  }

  // Sessions
  for (const session of data.sessions) {
    try {
      await db
        .insert(schema.sessions)
        .values(session)
        .onConflictDoNothing();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert session: ${msg}`);
    }
  }

  // Prompts - batch insert for performance
  const BATCH_SIZE = 100;
  for (let i = 0; i < data.prompts.length; i += BATCH_SIZE) {
    const batch = data.prompts.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(schema.prompts)
        .values(batch)
        .onConflictDoNothing();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to insert prompts batch ${i}: ${msg}`);
    }
  }

  // Prompt files
  if (data.promptFiles.length > 0) {
    for (let i = 0; i < data.promptFiles.length; i += BATCH_SIZE) {
      const batch = data.promptFiles.slice(i, i + BATCH_SIZE);
      try {
        await db
          .insert(schema.promptFiles)
          .values(batch)
          .onConflictDoNothing();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to insert prompt files batch ${i}: ${msg}`);
      }
    }
  }

  // Prompt tags
  if (data.promptTags.length > 0) {
    for (let i = 0; i < data.promptTags.length; i += BATCH_SIZE) {
      const batch = data.promptTags.slice(i, i + BATCH_SIZE);
      try {
        await db
          .insert(schema.promptTags)
          .values(batch)
          .onConflictDoNothing();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to insert prompt tags batch ${i}: ${msg}`);
      }
    }
  }

  // 4. Refresh template candidates from all prompts
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
