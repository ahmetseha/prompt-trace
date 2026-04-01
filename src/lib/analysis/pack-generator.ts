import type { Session, Prompt } from "@/lib/types";
import { inferPacks } from "./packs";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { savePromptPack } from "@/lib/db/queries";

/**
 * Re-generate prompt packs from all sessions and prompts.
 * Clears existing packs and saves newly inferred ones.
 * Returns the count of packs saved.
 */
export async function refreshPacks(
  sessions: Session[],
  prompts: Prompt[]
): Promise<number> {
  const packs = inferPacks(sessions, prompts);

  // Clear existing packs
  db.delete(schema.promptPacks).run();

  // Save each inferred pack
  let saved = 0;
  for (const pack of packs) {
    const id = await savePromptPack({
      title: pack.title,
      description: pack.description,
      workflowType: pack.workflowType,
      score: pack.score,
      stepsJson: JSON.stringify(pack.steps),
    });
    if (id) saved++;
  }

  return saved;
}
