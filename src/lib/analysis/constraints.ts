// ---------------------------------------------------------------------------
// Constraint-score calculator  (0–100)
// Measures whether the prompt defines output constraints and boundaries.
// ---------------------------------------------------------------------------

const REQUIREMENT_KEYWORDS = [
  { pattern: /\b(must|shall)\b/gi, label: 'strong requirement ("must"/"shall")' },
  { pattern: /\b(should|need to|needs to)\b/gi, label: 'moderate requirement ("should"/"need to")' },
  { pattern: /\b(without|don't|do not|don't|never|avoid)\b/gi, label: 'negative constraint' },
  { pattern: /\b(keep existing|preserve|maintain|don't change|do not change|leave .+ as is)\b/gi, label: 'preservation constraint' },
  { pattern: /\b(only|exactly|strictly|exclusively)\b/gi, label: 'exclusivity constraint' },
];

const SIZE_LIMIT_PATTERNS = [
  /\b(at most|at least|no more than|no fewer than|maximum|minimum|max|min)\b/i,
  /\b(up to|less than|greater than|between)\s+\d+/i,
  /\b\d+\s*(characters?|lines?|words?|bytes?|kb|mb|items?|rows?|elements?)\b/i,
];

const FORMAT_PATTERNS = [
  /\b(format|output|return|respond)\s+(as|in|with)\s+\w+/i,
  /\b(json|csv|xml|html|markdown|yaml|toml|plain text|table|list|array|object)\s*(format|output)?/i,
  /\b(typescript|javascript|python|rust|go)\s+(type|interface|class|function|module)/i,
  /\b(single file|separate files|inline|standalone)\b/i,
];

const COMPATIBILITY_PATTERNS = [
  /\b(compatible with|works with|supports?|backward compatible|backwards compatible)\b/i,
  /\b(version|v\d+|es\d+|node\s*\d+|react\s*\d+|typescript\s*\d+)\b/i,
  /\b(browser|mobile|desktop|cross-platform|responsive)\b/i,
];

const SUCCESS_CRITERIA_PATTERNS = [
  /\b(test|verify|ensure|check|validate|confirm)\s+(that|it|the)\b/i,
  /\b(expected|result|outcome|behavior|behaviour)\b/i,
  /\b(passing|green|no errors|no warnings|compiles?|builds?|runs?)\b/i,
];

/**
 * Calculate a constraint score (0–100) for a prompt.
 * Higher means better-defined output constraints and boundaries.
 */
export function calculateConstraintScore(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  if (!promptText || !promptText.trim()) {
    return { score: 0, explanation: 'Empty prompt has no constraints.', signals: ['empty prompt'] };
  }

  const text = promptText.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const signals: string[] = [];

  let score = 30;

  // --- Requirement keywords ---
  let requirementHits = 0;
  for (const { pattern, label } of REQUIREMENT_KEYWORDS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      requirementHits += matches.length;
      signals.push(`${label} (${matches.length}x)`);
    }
  }
  if (requirementHits >= 4) {
    score += 20;
  } else if (requirementHits >= 2) {
    score += 12;
  } else if (requirementHits >= 1) {
    score += 6;
  }

  // --- Size / quantity limits ---
  let hasSizeLimit = false;
  for (const rx of SIZE_LIMIT_PATTERNS) {
    if (rx.test(text)) {
      hasSizeLimit = true;
      break;
    }
  }
  if (hasSizeLimit) {
    score += 10;
    signals.push('size or quantity limit specified');
  }

  // --- Format requirements ---
  let hasFormatReq = false;
  for (const rx of FORMAT_PATTERNS) {
    if (rx.test(text)) {
      hasFormatReq = true;
      break;
    }
  }
  if (hasFormatReq) {
    score += 10;
    signals.push('output format requirement detected');
  }

  // --- Compatibility notes ---
  let hasCompatibility = false;
  for (const rx of COMPATIBILITY_PATTERNS) {
    if (rx.test(text)) {
      hasCompatibility = true;
      break;
    }
  }
  if (hasCompatibility) {
    score += 8;
    signals.push('compatibility requirement noted');
  }

  // --- Success criteria ---
  let hasSuccessCriteria = false;
  for (const rx of SUCCESS_CRITERIA_PATTERNS) {
    if (rx.test(text)) {
      hasSuccessCriteria = true;
      break;
    }
  }
  if (hasSuccessCriteria) {
    score += 8;
    signals.push('success criteria or validation mentioned');
  }

  // --- Open-ended with no boundaries penalty ---
  if (requirementHits === 0 && !hasSizeLimit && !hasFormatReq) {
    score -= 15;
    signals.push('no constraints, limits, or format requirements found');
  }

  // --- No success criteria penalty ---
  if (!hasSuccessCriteria && requirementHits === 0) {
    score -= 5;
    signals.push('no success criteria defined');
  }

  // --- Very short prompts rarely have constraints ---
  if (wordCount < 8 && requirementHits === 0) {
    score -= 10;
    signals.push('short prompt with no constraints');
  }

  // --- Bonus for multi-line structured constraints ---
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length >= 3) {
    const constraintLines = lines.filter((l) =>
      /\b(must|should|don't|without|only|never|always|keep|preserve|format|limit|max|min)\b/i.test(l),
    );
    if (constraintLines.length >= 2) {
      score += 8;
      signals.push(`${constraintLines.length} lines with constraint language`);
    }
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    score >= 80
      ? 'Prompt has well-defined constraints, limits, and output requirements.'
      : score >= 60
        ? 'Prompt has some constraints but could benefit from format requirements or success criteria.'
        : score >= 40
          ? 'Prompt has few constraints – consider adding requirements, limits, or format guidance.'
          : 'Prompt is open-ended with no clear boundaries – add constraints to guide the output.';

  return { score, explanation, signals };
}
