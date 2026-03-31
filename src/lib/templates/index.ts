export { extractTemplates } from './extract';
export type { ExtractedTemplate } from './extract';

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { extractTemplates } from './extract';
import type { Prompt } from '@/lib/types';
import { generateId } from '@/lib/utils';

/**
 * Run the template extraction algorithm on the supplied prompts and persist
 * the results to the `template_candidates` table, replacing any previous
 * candidates.
 *
 * @returns The number of templates written.
 */
export async function refreshTemplates(prompts: Prompt[]): Promise<number> {
  const templates = extractTemplates(prompts);

  // Clear existing template candidates
  db.delete(schema.templateCandidates).run();

  // Insert new ones
  const now = Date.now();
  for (const t of templates) {
    db.insert(schema.templateCandidates)
      .values({
        id: generateId(),
        title: t.title,
        normalizedPattern: t.normalizedPattern,
        description: t.description,
        sourcePromptIdsJson: JSON.stringify(t.sourcePromptIds),
        reuseScore: t.reuseScore,
        category: t.category,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return templates.length;
}
