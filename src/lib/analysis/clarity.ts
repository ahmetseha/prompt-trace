// ---------------------------------------------------------------------------
// Clarity-score calculator  (0–100)
// Measures how clear and unambiguous a prompt is.
// ---------------------------------------------------------------------------

const SPECIFIC_ACTION_VERBS = [
  'add', 'create', 'update', 'remove', 'fix', 'refactor', 'implement',
  'write', 'generate', 'build', 'configure', 'set up', 'migrate',
  'convert', 'test', 'deploy', 'optimize', 'move', 'rename', 'extract',
  'replace', 'delete', 'install', 'integrate', 'validate', 'parse',
  'export', 'import', 'format', 'sort', 'filter', 'merge', 'split',
];

const VAGUE_WORDS = [
  'something', 'stuff', 'things', 'whatever', 'maybe', 'kind of',
  'sort of', 'somehow', 'idk', 'i guess', 'not sure', 'possibly',
  'perhaps', 'might', 'kinda', 'dunno', 'whatnot', 'etc',
];

const AMBIGUOUS_PRONOUNS_PATTERN = /\b(it|that|this|these|those|they)\b/gi;

const OUTPUT_FORMAT_PATTERNS = [
  /\b(return|output|respond|format)\s+(as|in|with)\b/i,
  /\b(json|csv|xml|html|markdown|yaml|table|list|array)\b/i,
  /\b(no\s+comments|with\s+comments|typed|untyped)\b/i,
];

const CONSTRAINT_KEYWORDS = [
  /\b(must|should|without|don't|do not|never|always|only|exactly)\b/i,
  /\b(keep existing|preserve|maintain|ensure)\b/i,
  /\b(at most|at least|no more than|no fewer than|maximum|minimum)\b/i,
];

/**
 * Calculate a clarity score (0–100) for a prompt.
 * Higher means clearer and less ambiguous.
 */
export function calculateClarityScore(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  if (!promptText || !promptText.trim()) {
    return { score: 0, explanation: 'Empty prompt has no clarity.', signals: ['empty prompt'] };
  }

  const text = promptText.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const signals: string[] = [];

  let score = 50;

  // --- Specific action verbs ---
  let actionVerbCount = 0;
  for (const verb of SPECIFIC_ACTION_VERBS) {
    if (lower.includes(verb)) actionVerbCount++;
  }
  if (actionVerbCount >= 3) {
    score += 12;
    signals.push(`${actionVerbCount} specific action verbs found`);
  } else if (actionVerbCount >= 1) {
    score += 6;
    signals.push(`${actionVerbCount} specific action verb(s) found`);
  } else {
    score -= 15;
    signals.push('no specific action verbs detected');
  }

  // --- Clear target ---
  const hasFilePaths = /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)+|[A-Z]:\\[\w\-.]+)/g.test(text);
  const hasFunctionNames = /\b[a-z][a-zA-Z0-9]*(?:Function|Handler|Component|Module|Service|Controller|Hook|Provider|Util)\b/.test(text);
  const hasBacktickRefs = /`[^`]+`/.test(text);
  if (hasFilePaths || hasFunctionNames || hasBacktickRefs) {
    score += 8;
    signals.push('clear target references identified');
  } else {
    score -= 5;
    signals.push('no clear target (file, function, or component)');
  }

  // --- Numbered steps / structure ---
  const hasNumberedSteps = /^\s*\d+[\.\)]\s/m.test(text);
  const hasBulletPoints = /^\s*[-\*]\s/m.test(text);
  if (hasNumberedSteps) {
    score += 10;
    signals.push('numbered steps provide clear structure');
  } else if (hasBulletPoints) {
    score += 6;
    signals.push('bullet points provide some structure');
  }

  // --- Explicit output format ---
  let hasOutputFormat = false;
  for (const rx of OUTPUT_FORMAT_PATTERNS) {
    if (rx.test(text)) {
      hasOutputFormat = true;
      break;
    }
  }
  if (hasOutputFormat) {
    score += 8;
    signals.push('explicit output format specified');
  }

  // --- Constraints defined ---
  let constraintCount = 0;
  for (const rx of CONSTRAINT_KEYWORDS) {
    if (rx.test(text)) constraintCount++;
  }
  if (constraintCount >= 2) {
    score += 8;
    signals.push(`${constraintCount} constraint keywords found`);
  } else if (constraintCount === 1) {
    score += 4;
    signals.push('1 constraint keyword found');
  }

  // --- Vague words penalty ---
  let vagueCount = 0;
  for (const vague of VAGUE_WORDS) {
    if (lower.includes(vague)) vagueCount++;
  }
  if (vagueCount >= 3) {
    score -= 20;
    signals.push(`${vagueCount} vague words detected (heavy penalty)`);
  } else if (vagueCount >= 1) {
    score -= vagueCount * 5;
    signals.push(`${vagueCount} vague word(s) detected`);
  }

  // --- No clear action ---
  const startsImperative = /^\s*(add|create|fix|make|update|remove|change|write|implement|generate|build|deploy|refactor|convert|test|configure|set up|replace|delete|install|move|rename|extract)\b/i.test(lower);
  if (!startsImperative && actionVerbCount === 0) {
    score -= 10;
    signals.push('prompt does not start with a clear action');
  }

  // --- Ambiguous pronouns ---
  const pronounMatches = text.match(AMBIGUOUS_PRONOUNS_PATTERN) ?? [];
  if (pronounMatches.length > 3) {
    score -= 8;
    signals.push(`${pronounMatches.length} ambiguous pronouns found`);
  } else if (pronounMatches.length > 1) {
    score -= 3;
    signals.push(`${pronounMatches.length} ambiguous pronouns found`);
  }

  // --- Too many questions without focus ---
  const questionCount = (text.match(/\?/g) ?? []).length;
  if (questionCount > 3) {
    score -= 10;
    signals.push(`${questionCount} questions – may lack focus`);
  } else if (questionCount > 1) {
    score -= 4;
    signals.push(`${questionCount} questions detected`);
  }

  // --- Length sanity ---
  if (wordCount < 3) {
    score -= 15;
    signals.push('very short prompt – likely lacks clarity');
  } else if (wordCount >= 10 && wordCount <= 120) {
    score += 5;
    signals.push('good prompt length for clarity');
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    score >= 80
      ? 'Prompt is clear with specific actions, targets, and structure.'
      : score >= 60
        ? 'Prompt is moderately clear but could benefit from more specificity or structure.'
        : score >= 40
          ? 'Prompt has some clarity issues – consider adding action verbs, targets, or constraints.'
          : 'Prompt is vague or ambiguous – needs specific actions, clear targets, and structure.';

  return { score, explanation, signals };
}
