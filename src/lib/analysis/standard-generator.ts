import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { inferStandards } from './standards';
import { saveStandard } from '@/lib/db/queries';
import { generateId } from '@/lib/utils';
import type { Prompt, TemplateCandidate } from '@/lib/types';

/**
 * Re-derive standards from the full prompt & template corpus,
 * clear old standards, and persist the new set.
 *
 * @returns The number of standards written.
 */
export async function refreshStandards(
  prompts: Prompt[],
  templates: TemplateCandidate[],
): Promise<number> {
  const inferred = inferStandards(prompts, templates);

  // Clear existing standards
  db.delete(schema.standards).run();

  // Persist each inferred standard
  for (const s of inferred) {
    await saveStandard({
      id: generateId(),
      title: s.title,
      category: s.category,
      description: s.description,
      recommendedStructure: s.recommendedStructure,
      examplesJson: JSON.stringify(s.examples),
      notesJson: JSON.stringify(s.notes),
    });
  }

  return inferred.length;
}
