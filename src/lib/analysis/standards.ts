import type { Prompt } from '@/lib/types';
import type { TemplateCandidate } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InferredStandard {
  title: string;
  category: string;
  description: string;
  recommendedStructure: string; // the ideal prompt structure
  examples: string[]; // best example prompts
  notes: string[]; // anti-patterns to avoid
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick the top N prompts by combined successScore + reuseScore. */
function topByScore(prompts: Prompt[], n: number): Prompt[] {
  return [...prompts]
    .sort(
      (a, b) =>
        ((b.successScore ?? 0) + (b.reuseScore ?? 0)) -
        ((a.successScore ?? 0) + (a.reuseScore ?? 0)),
    )
    .slice(0, n);
}

/** Pick the bottom N prompts by combined score. */
function bottomByScore(prompts: Prompt[], n: number): Prompt[] {
  return [...prompts]
    .sort(
      (a, b) =>
        ((a.successScore ?? 0) + (a.reuseScore ?? 0)) -
        ((b.successScore ?? 0) + (b.reuseScore ?? 0)),
    )
    .slice(0, n);
}

/**
 * Build a "recommended structure" string by extracting common structural
 * cues (numbered steps, headings, bullet points, code fences, etc.)
 * from the best-performing prompts in a group.
 */
function extractStructure(prompts: Prompt[]): string {
  const patterns: string[] = [];

  const hasNumberedSteps = prompts.some((p) => /\d+[\.\)]\s/.test(p.promptText ?? ''));
  const hasBullets = prompts.some((p) => /^[\-\*]\s/m.test(p.promptText ?? ''));
  const hasCodeBlocks = prompts.some((p) => /```/.test(p.promptText ?? ''));
  const hasConstraints = prompts.some((p) =>
    /(must|should|do not|don't|ensure|avoid|always|never)/i.test(p.promptText ?? ''),
  );
  const hasContext = prompts.some((p) =>
    /(context|background|given that|currently)/i.test(p.promptText ?? ''),
  );
  const hasExamples = prompts.some((p) =>
    /(example|for instance|e\.g\.|such as)/i.test(p.promptText ?? ''),
  );

  if (hasContext) patterns.push('1. Context: State the background or current situation');
  patterns.push(`${patterns.length + 1}. Intent: Clearly state what you need`);
  if (hasConstraints) patterns.push(`${patterns.length + 1}. Constraints: Specify requirements (must/should/avoid)`);
  if (hasNumberedSteps) patterns.push(`${patterns.length + 1}. Steps: Break the task into numbered steps`);
  if (hasBullets) patterns.push(`${patterns.length + 1}. Details: Use bullet points for specifics`);
  if (hasCodeBlocks) patterns.push(`${patterns.length + 1}. Code: Include code blocks for reference`);
  if (hasExamples) patterns.push(`${patterns.length + 1}. Examples: Provide concrete examples`);
  patterns.push(`${patterns.length + 1}. Output format: Describe desired output`);

  return patterns.join('\n');
}

/**
 * Extract anti-pattern notes from the worst-performing prompts.
 */
function extractAntiPatterns(prompts: Prompt[]): string[] {
  const notes: string[] = [];

  const avgLength =
    prompts.reduce((sum, p) => sum + (p.promptText?.length ?? 0), 0) / (prompts.length || 1);

  if (avgLength < 30) {
    notes.push('Avoid overly short prompts that lack context or specificity');
  }
  if (avgLength > 2000) {
    notes.push('Avoid extremely long prompts that bury the intent in noise');
  }

  const vague = prompts.filter((p) =>
    /^(fix|help|do|make|change|update)\s/i.test((p.promptText ?? '').trim()),
  );
  if (vague.length > 0) {
    notes.push('Avoid starting with vague verbs like "fix" or "help" without specifics');
  }

  const noConstraints = prompts.filter(
    (p) => !/(must|should|ensure|avoid|always|never)/i.test(p.promptText ?? ''),
  );
  if (noConstraints.length > prompts.length * 0.6) {
    notes.push('Avoid prompts with no explicit constraints or requirements');
  }

  const noContext = prompts.filter(
    (p) => !/(context|background|given|currently|existing)/i.test(p.promptText ?? ''),
  );
  if (noContext.length > prompts.length * 0.6) {
    notes.push('Avoid prompts that lack context about the current state');
  }

  if (notes.length === 0) {
    notes.push('No obvious anti-patterns detected in low-scoring prompts');
  }

  return notes;
}

/** Title-case a category slug. */
function titleCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Infer best-practice standards from the prompt corpus and extracted templates.
 */
export function inferStandards(
  prompts: Prompt[],
  templates: TemplateCandidate[],
): InferredStandard[] {
  const standards: InferredStandard[] = [];

  // 1. Group prompts by category
  const byCategory = new Map<string, Prompt[]>();
  for (const p of prompts) {
    if (!p.category) continue;
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }

  // 2. For each category with 5+ prompts, derive a standard
  for (const [category, catPrompts] of byCategory) {
    if (catPrompts.length < 5) continue;

    const best = topByScore(catPrompts, 3);
    const worst = bottomByScore(catPrompts, 3);

    const recommendedStructure = extractStructure(best);
    // Skip short/noise prompts when picking best examples
    const examples = best
      .map((p) => (p.promptText ?? '').slice(0, 300))
      .filter((t) => t.length >= 20);
    // Only include meaningful anti-patterns from prompts with actual content
    const meaningfulWorst = worst.filter((p) => (p.promptText ?? '').trim().length >= 20);
    const notes = meaningfulWorst.length > 0 ? extractAntiPatterns(meaningfulWorst) : [];

    const avgSuccess =
      best.reduce((s, p) => s + (p.successScore ?? 0), 0) / (best.length || 1);

    standards.push({
      title: `${titleCase(category)} Prompt Standard`,
      category,
      description: `Best-practice structure for ${titleCase(category).toLowerCase()} prompts, derived from ${catPrompts.length} examples (top avg success: ${Math.round(avgSuccess)}%).`,
      recommendedStructure,
      examples,
      notes,
    });
  }

  // 3. Template-based standards for high-reuse templates
  for (const t of templates) {
    if ((t.reuseScore ?? 0) <= 60) continue;

    const category = t.category ?? 'general';
    // Skip if we already have a standard for this category from step 2
    if (standards.some((s) => s.category === category)) continue;

    standards.push({
      title: `${titleCase(category)} Prompt Standard`,
      category,
      description: t.description ?? `Reusable pattern derived from template "${t.title}".`,
      recommendedStructure: t.normalizedPattern ?? 'Follow the template pattern.',
      examples: [],
      notes: [],
    });
  }

  // 4. Sort by category
  standards.sort((a, b) => a.category.localeCompare(b.category));

  return standards;
}
