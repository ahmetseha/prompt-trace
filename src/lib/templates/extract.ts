import type { Prompt, PromptCategory } from '@/lib/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ExtractedTemplate {
  title: string;
  normalizedPattern: string;
  description: string;
  sourcePromptIds: string[];
  reuseScore: number;
  category: PromptCategory | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum Jaccard similarity to consider two prompts structurally alike. */
const SIMILARITY_THRESHOLD = 0.7;

/** Maximum number of templates to return. */
const MAX_TEMPLATES = 20;

/** Minimum group size to qualify as a template. */
const MIN_GROUP_SIZE = 2;

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Strip project-specific details from a prompt so that structurally similar
 * prompts collapse to the same (or very close) normalized form.
 */
export function normalizePromptText(text: string): string {
  let result = text;

  // Replace file paths (Unix and Windows)
  result = result.replace(
    /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)*\.\w+|[A-Z]:\\[\w\-.\\]+)/g,
    '[FILE_PATH]',
  );

  // Replace remaining standalone file names (e.g. `foo.tsx`, `bar.py`)
  result = result.replace(/\b[\w\-]+\.(ts|tsx|js|jsx|py|rb|go|rs|java|vue|svelte|css|scss|html|json|yaml|yml|toml|md)\b/g, '[FILE_PATH]');

  // Replace quoted strings (single, double, backtick)
  result = result.replace(/"[^"]*"/g, '[STRING]');
  result = result.replace(/'[^']*'/g, '[STRING]');
  result = result.replace(/`[^`]*`/g, '[STRING]');

  // Replace numbers (standalone)
  result = result.replace(/\b\d+(\.\d+)?\b/g, '[N]');

  // Replace long camelCase / PascalCase identifiers (likely variable names)
  result = result.replace(/\b[a-z][a-zA-Z0-9]{12,}\b/g, '[IDENTIFIER]');
  result = result.replace(/\b[A-Z][a-zA-Z0-9]{12,}\b/g, '[IDENTIFIER]');

  // Collapse whitespace and lowercase
  result = result.replace(/\s+/g, ' ').trim().toLowerCase();

  return result;
}

// ---------------------------------------------------------------------------
// Similarity
// ---------------------------------------------------------------------------

/**
 * Jaccard similarity on the word-level token sets of two strings.
 * Returns a value in [0, 1].
 */
export function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Pattern generation
// ---------------------------------------------------------------------------

/**
 * Given an array of raw prompt texts that have been judged similar, produce a
 * single "pattern" string that captures their shared structure and replaces the
 * variable parts with `[PLACEHOLDER]`.
 */
export function generatePattern(promptTexts: string[]): string {
  if (promptTexts.length === 0) return '';
  if (promptTexts.length === 1) return normalizePromptText(promptTexts[0]);

  // Tokenize each normalized prompt
  const tokenized = promptTexts.map((t) =>
    normalizePromptText(t).split(/\s+/).filter(Boolean),
  );

  // Find words that appear in at least half the prompts (rounded up)
  const threshold = Math.ceil(tokenized.length / 2);
  const wordCounts = new Map<string, number>();
  for (const tokens of tokenized) {
    const unique = new Set(tokens);
    for (const word of unique) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  const commonWords = new Set<string>();
  for (const [word, count] of wordCounts) {
    if (count >= threshold) commonWords.add(word);
  }

  // Build the pattern by walking the longest prompt and keeping common words
  const longestTokens = tokenized.reduce(
    (a, b) => (a.length >= b.length ? a : b),
    tokenized[0],
  );

  const patternTokens: string[] = [];
  let lastWasPlaceholder = false;

  for (const token of longestTokens) {
    if (commonWords.has(token)) {
      patternTokens.push(token);
      lastWasPlaceholder = false;
    } else if (!lastWasPlaceholder) {
      patternTokens.push('[PLACEHOLDER]');
      lastWasPlaceholder = true;
    }
  }

  return patternTokens.join(' ');
}

// ---------------------------------------------------------------------------
// Title generation
// ---------------------------------------------------------------------------

/** Human-readable category labels. */
const CATEGORY_LABELS: Record<string, string> = {
  'bug-fixing': 'Bug Fix',
  refactor: 'Refactor',
  architecture: 'Architecture',
  'code-generation': 'Code Generation',
  debugging: 'Debugging',
  styling: 'Styling',
  testing: 'Testing',
  documentation: 'Documentation',
  deployment: 'Deployment',
  'data-backend': 'Data / Backend',
  performance: 'Performance',
  exploratory: 'Exploratory',
  review: 'Code Review',
  unknown: 'General',
};

/**
 * Derive a short human-readable title from the common pattern and category.
 */
export function generateTitle(
  pattern: string,
  category: string | null,
): string {
  const catLabel = category ? CATEGORY_LABELS[category] ?? 'General' : 'General';

  // Extract the most meaningful tokens from the pattern (skip placeholders and
  // very short/common words).
  const stopWords = new Set([
    'the', 'a', 'an', 'to', 'in', 'for', 'of', 'and', 'or', 'is', 'it',
    'this', 'that', 'with', 'on', 'at', 'by', 'from', 'as', 'be', 'are',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
    'i', 'me', 'my', 'we', 'you', 'your', 'please', 'also', 'so',
    '[placeholder]', '[string]', '[file_path]', '[n]', '[identifier]',
  ]);

  const meaningful = pattern
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 5);

  if (meaningful.length === 0) {
    return `${catLabel} Template`;
  }

  // Capitalize first word
  const phrase = meaningful.join(' ');
  const capitalized = phrase.charAt(0).toUpperCase() + phrase.slice(1);

  return `${catLabel}: ${capitalized}`;
}

// ---------------------------------------------------------------------------
// Main extraction
// ---------------------------------------------------------------------------

/**
 * Analyse an array of prompts and extract reusable template candidates.
 *
 * The algorithm is deterministic and runs entirely in-memory:
 * 1. Group prompts by category.
 * 2. Within each group, cluster prompts whose normalised forms exceed a
 *    Jaccard similarity threshold.
 * 3. For each cluster of 2+ prompts, derive a pattern, title and description.
 * 4. Return the top templates sorted by reuse score.
 */
export function extractTemplates(prompts: Prompt[]): ExtractedTemplate[] {
  // Filter to prompts that actually have meaningful text (skip noise)
  const NOISE_PREFIXES = ['[Image]', '<task-notification', '[Request interrupted'];
  const usable = prompts.filter((p) => {
    const text = (p.promptText ?? '').trim();
    if (text.length < 10) return false;
    if (NOISE_PREFIXES.some((prefix) => text.startsWith(prefix))) return false;
    if (/^\d+$/.test(text)) return false; // just numbers
    if (!/\s/.test(text)) return false; // single word
    return true;
  });
  if (usable.length === 0) return [];

  // Step 1 – group by category
  const byCategory = new Map<PromptCategory | 'unknown', Prompt[]>();
  for (const p of usable) {
    const cat: PromptCategory = p.category ?? 'unknown';
    let group = byCategory.get(cat);
    if (!group) {
      group = [];
      byCategory.set(cat, group);
    }
    group.push(p);
  }

  const templates: ExtractedTemplate[] = [];

  // Step 2 – cluster within each category
  for (const [category, group] of byCategory) {
    // Pre-normalize all prompts in this group
    const normalized = group.map((p) => normalizePromptText(p.promptText!));

    // Track which prompts have already been assigned to a cluster
    const assigned = new Set<number>();

    for (let i = 0; i < group.length; i++) {
      if (assigned.has(i)) continue;

      const cluster: number[] = [i];
      assigned.add(i);

      for (let j = i + 1; j < group.length; j++) {
        if (assigned.has(j)) continue;

        const sim = calculateSimilarity(normalized[i], normalized[j]);
        if (sim >= SIMILARITY_THRESHOLD) {
          cluster.push(j);
          assigned.add(j);
        }
      }

      if (cluster.length < MIN_GROUP_SIZE) continue;

      // Step 3 – build template from cluster
      const clusterPrompts = cluster.map((idx) => group[idx]);
      const clusterTexts = cluster.map((idx) => group[idx].promptText!);

      // Skip groups where average prompt length is too short (noise)
      const avgLen = clusterTexts.reduce((s, t) => s + t.length, 0) / clusterTexts.length;
      if (avgLen <= 20) continue;

      const pattern = generatePattern(clusterTexts);
      const title = generateTitle(pattern, category);

      // Average reuse score
      const scores = clusterPrompts
        .map((p) => p.reuseScore ?? 0)
        .filter((s) => s > 0);
      const avgReuse =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 50;

      const description = `Template extracted from ${clusterPrompts.length} similar prompts in the "${category}" category. ` +
        `Average reuse score: ${avgReuse}.`;

      templates.push({
        title,
        normalizedPattern: pattern,
        description,
        sourcePromptIds: clusterPrompts.map((p) => p.id),
        reuseScore: avgReuse,
        category: category === 'unknown' ? null : (category as PromptCategory),
      });
    }
  }

  // Step 4 – sort by reuse score descending, then by source count descending
  templates.sort((a, b) => {
    if (b.reuseScore !== a.reuseScore) return b.reuseScore - a.reuseScore;
    return b.sourcePromptIds.length - a.sourcePromptIds.length;
  });

  return templates.slice(0, MAX_TEMPLATES);
}
