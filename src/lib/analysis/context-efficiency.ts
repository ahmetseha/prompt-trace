// ---------------------------------------------------------------------------
// Context-efficiency-score calculator  (0–100)
// Measures how efficiently context is provided in a prompt.
// ---------------------------------------------------------------------------

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;

/**
 * Calculate a context-efficiency score (0–100) for a prompt.
 * Higher means context is concise, relevant, and well-balanced.
 */
export function calculateContextEfficiency(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  if (!promptText || !promptText.trim()) {
    return { score: 0, explanation: 'Empty prompt has no context.', signals: ['empty prompt'] };
  }

  const text = promptText.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const signals: string[] = [];

  let score = 55;

  // --- Analyze code blocks ---
  const codeBlocks = text.match(CODE_BLOCK_PATTERN) ?? [];
  let totalCodeWords = 0;
  for (const block of codeBlocks) {
    const blockWords = block.split(/\s+/).filter(Boolean).length;
    totalCodeWords += blockWords;
  }

  const nonCodeWords = wordCount - totalCodeWords;
  const codeRatio = wordCount > 0 ? totalCodeWords / wordCount : 0;

  // --- Too much code pasted ---
  if (totalCodeWords > 500) {
    score -= 20;
    signals.push(`excessive code context (~${totalCodeWords} words of code)`);
  } else if (totalCodeWords > 200) {
    score -= 8;
    signals.push(`large code context (~${totalCodeWords} words of code)`);
  } else if (totalCodeWords > 0 && totalCodeWords <= 200) {
    score += 8;
    signals.push('code snippets provided at reasonable length');
  }

  // --- Code-to-instruction ratio ---
  if (codeRatio > 0.8 && wordCount > 50) {
    score -= 12;
    signals.push('prompt is mostly code with little instruction');
  } else if (codeRatio > 0 && codeRatio <= 0.6) {
    score += 5;
    signals.push('good balance of code and instruction');
  }

  // --- Too terse (no context at all) ---
  if (wordCount < 5) {
    score -= 20;
    signals.push('too terse – likely missing necessary context');
  } else if (wordCount < 10 && codeBlocks.length === 0) {
    score -= 10;
    signals.push('very short with no code context');
  }

  // --- Overly verbose ---
  if (wordCount > 500 && codeBlocks.length === 0) {
    score -= 15;
    signals.push('very long prompt with no code – may contain excessive prose');
  } else if (wordCount > 300 && codeBlocks.length === 0) {
    score -= 8;
    signals.push('long prompt without code context');
  }

  // --- Sweet spot ---
  if (nonCodeWords >= 15 && nonCodeWords <= 150) {
    score += 8;
    signals.push('instruction length is in the efficient range');
  }

  // --- Clear error messages ---
  const hasErrorMessage =
    /\b(error|exception|stack trace|traceback|failed|failure)\b/i.test(text) &&
    (codeBlocks.length > 0 || /`[^`]+`/.test(text));
  if (hasErrorMessage) {
    score += 8;
    signals.push('error message provided with context');
  }

  // --- Focused scope ---
  const sentenceCount = (text.match(/[.!?]+/g) ?? []).length + 1;
  const topicChanges = countTopicChanges(text);
  if (topicChanges > 3) {
    score -= 10;
    signals.push('multiple topic changes suggest unfocused context');
  } else if (sentenceCount <= 5 && nonCodeWords >= 10) {
    score += 5;
    signals.push('concise and focused');
  }

  // --- Inline code references (positive – targeted context) ---
  const inlineRefs = text.match(INLINE_CODE_PATTERN) ?? [];
  if (inlineRefs.length >= 2 && inlineRefs.length <= 10) {
    score += 5;
    signals.push(`${inlineRefs.length} inline code references – targeted context`);
  }

  // --- Multiple large code blocks ---
  if (codeBlocks.length > 3) {
    score -= 8;
    signals.push(`${codeBlocks.length} code blocks – consider reducing to relevant snippets`);
  }

  // --- Irrelevant information markers ---
  const irrelevantPatterns = /\b(by the way|also unrelated|on another note|btw|off topic)\b/i;
  if (irrelevantPatterns.test(text)) {
    score -= 8;
    signals.push('contains markers of irrelevant information');
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    score >= 80
      ? 'Context is concise, relevant, and well-balanced with instructions.'
      : score >= 60
        ? 'Context is adequate but could be more focused or better balanced.'
        : score >= 40
          ? 'Context efficiency is low – either too much, too little, or unfocused information.'
          : 'Context is poorly managed – excessive code, missing context, or irrelevant information.';

  return { score, explanation, signals };
}

/**
 * Rough heuristic for topic changes: counts transitions between
 * sentences that share few common significant words.
 */
function countTopicChanges(text: string): number {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length < 2) return 0;

  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'it', 'this', 'that', 'i', 'you',
    'we', 'they', 'and', 'or', 'but', 'not', 'so', 'if', 'then', 'please',
  ]);

  function significantWords(sentence: string): Set<string> {
    return new Set(
      sentence
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w)),
    );
  }

  let changes = 0;
  for (let i = 1; i < sentences.length; i++) {
    const prev = significantWords(sentences[i - 1]);
    const curr = significantWords(sentences[i]);
    let overlap = 0;
    for (const w of curr) {
      if (prev.has(w)) overlap++;
    }
    if (overlap === 0 && prev.size > 0 && curr.size > 0) {
      changes++;
    }
  }

  return changes;
}
