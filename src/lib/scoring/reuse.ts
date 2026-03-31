// ---------------------------------------------------------------------------
// Reuse-score calculator  (0–100)
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  'add', 'create', 'update', 'remove', 'fix', 'refactor', 'implement',
  'write', 'generate', 'build', 'configure', 'set up', 'migrate',
  'convert', 'test', 'deploy', 'optimize', 'move', 'rename', 'extract',
];

/** Regex for paths like `./foo/bar.ts`, `/src/lib`, `C:\Users` */
const PATH_PATTERN = /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)+|[A-Z]:\\[\w\-.]+)/gi;

/** Patterns that indicate project-specific references */
const SPECIFIC_PATTERNS = [
  /`[A-Za-z]\w+\.(ts|tsx|js|jsx|py|rb|go|rs|java|vue|svelte)`/g, // inline file refs
  PATH_PATTERN,
  /\b[a-z][a-zA-Z0-9]{15,}\b/g, // very long camelCase identifiers (likely project-specific)
];

/**
 * Calculate a reuse score (0–100) estimating how reusable / template-worthy a prompt is.
 */
export function calculateReuseScore(prompt: {
  promptText: string;
  category: string;
  intent: string;
}): number {
  const { promptText, intent } = prompt;
  if (!promptText) return 0;

  const text = promptText.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let score = 50; // start at midpoint

  // -----------------------------------------------------------------------
  // Length heuristics
  // -----------------------------------------------------------------------
  if (wordCount < 5) {
    score -= 25; // too terse to be reusable
  } else if (wordCount < 10) {
    score -= 15;
  } else if (wordCount >= 15 && wordCount <= 80) {
    score += 10; // sweet spot
  } else if (wordCount > 200 && wordCount <= 500) {
    score -= 5; // getting long
  } else if (wordCount > 500) {
    score -= 15; // overly long – likely context-heavy
  }

  // -----------------------------------------------------------------------
  // Action verbs – imperative prompts are more template-friendly
  // -----------------------------------------------------------------------
  const lower = text.toLowerCase();
  let actionVerbCount = 0;
  for (const v of ACTION_VERBS) {
    if (lower.includes(v)) actionVerbCount++;
  }
  score += Math.min(actionVerbCount * 3, 15);

  // -----------------------------------------------------------------------
  // Intent bonus
  // -----------------------------------------------------------------------
  if (intent === 'instruct' || intent === 'generate') {
    score += 8;
  } else if (intent === 'fix' || intent === 'transform') {
    score += 5;
  } else if (intent === 'ask' || intent === 'explain') {
    score -= 5; // questions are less reusable as templates
  }

  // -----------------------------------------------------------------------
  // Project-specific penalty
  // -----------------------------------------------------------------------
  let specificHits = 0;
  for (const rx of SPECIFIC_PATTERNS) {
    const matches = text.match(rx);
    if (matches) specificHits += matches.length;
  }
  score -= Math.min(specificHits * 5, 25);

  // -----------------------------------------------------------------------
  // Structural patterns that boost reusability
  // -----------------------------------------------------------------------
  // Numbered steps / bullet points
  if (/^\s*[\d\-\*]\s/m.test(text)) score += 5;
  // Contains placeholder-like syntax: <foo>, {foo}, [foo]
  if (/<\w+>|\{\w+\}|\[\w+\]/i.test(text)) score += 8;
  // Has explicit instructions separated by newlines
  const lineCount = text.split('\n').filter((l) => l.trim().length > 0).length;
  if (lineCount >= 3 && lineCount <= 15) score += 5;

  // -----------------------------------------------------------------------
  // Mostly context, little instruction
  // -----------------------------------------------------------------------
  const codeBlockCount = (text.match(/```/g) ?? []).length / 2;
  if (codeBlockCount >= 2 && wordCount > 100) {
    // Lots of code pasted in – context-heavy
    score -= 10;
  }

  // Clamp
  return Math.max(0, Math.min(100, Math.round(score)));
}
