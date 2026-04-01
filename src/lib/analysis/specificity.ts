// ---------------------------------------------------------------------------
// Specificity-score calculator  (0–100)
// Measures how specific vs vague a prompt is.
// ---------------------------------------------------------------------------

const TECHNOLOGY_NAMES = [
  'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'fastify',
  'django', 'flask', 'rails', 'spring', 'laravel', 'nestjs', 'prisma',
  'drizzle', 'sequelize', 'mongoose', 'postgres', 'mysql', 'sqlite', 'redis',
  'mongodb', 'docker', 'kubernetes', 'terraform', 'aws', 'gcp', 'azure',
  'typescript', 'javascript', 'python', 'rust', 'go', 'java', 'ruby',
  'tailwind', 'css', 'sass', 'webpack', 'vite', 'esbuild', 'rollup',
  'jest', 'vitest', 'mocha', 'cypress', 'playwright', 'graphql', 'rest',
  'node', 'deno', 'bun', 'supabase', 'firebase', 'vercel', 'netlify',
];

/** Regex for file paths */
const PATH_PATTERN = /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)+|[A-Z]:\\[\w\-.]+)/g;

/** Regex for function/variable-like names in backticks */
const CODE_REF_PATTERN = /`[a-zA-Z_]\w*(?:\.\w+)*(?:\(\))?`/g;

/** Regex for numbers with units or standalone specific numbers */
const NUMBER_PATTERN = /\b\d+\s*(?:px|em|rem|ms|s|kb|mb|gb|%|items?|rows?|columns?|bytes?|characters?|lines?|files?|requests?)\b/i;

const GENERIC_PHRASES = [
  'make it better', 'make it work', 'fix it', 'improve this',
  'clean up', 'make it nice', 'do something', 'help me',
  'i need help', 'can you help', 'make it good', 'make it fast',
  'optimize it', 'refactor this',
];

const ERROR_MESSAGE_PATTERNS = [
  /error:\s*.+/i,
  /exception:\s*.+/i,
  /`[^`]*error[^`]*`/i,
  /cannot\s+\w+\s+\w+/i,
  /unexpected\s+\w+/i,
  /is not\s+(a|defined|assignable|compatible)/i,
];

/**
 * Calculate a specificity score (0–100) for a prompt.
 * Higher means more specific and detailed.
 */
export function calculateSpecificityScore(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  if (!promptText || !promptText.trim()) {
    return { score: 0, explanation: 'Empty prompt has no specificity.', signals: ['empty prompt'] };
  }

  const text = promptText.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const signals: string[] = [];

  let score = 40;

  // --- Named technologies ---
  let techCount = 0;
  for (const tech of TECHNOLOGY_NAMES) {
    if (lower.includes(tech)) techCount++;
  }
  if (techCount >= 3) {
    score += 15;
    signals.push(`${techCount} named technologies referenced`);
  } else if (techCount >= 1) {
    score += techCount * 5;
    signals.push(`${techCount} named technology/technologies referenced`);
  } else {
    score -= 5;
    signals.push('no specific technologies mentioned');
  }

  // --- File paths ---
  const pathMatches = text.match(PATH_PATTERN) ?? [];
  if (pathMatches.length >= 2) {
    score += 12;
    signals.push(`${pathMatches.length} file paths referenced`);
  } else if (pathMatches.length === 1) {
    score += 7;
    signals.push('1 file path referenced');
  }

  // --- Code references (backtick names) ---
  const codeRefs = text.match(CODE_REF_PATTERN) ?? [];
  if (codeRefs.length >= 3) {
    score += 10;
    signals.push(`${codeRefs.length} code references in backticks`);
  } else if (codeRefs.length >= 1) {
    score += 5;
    signals.push(`${codeRefs.length} code reference(s) in backticks`);
  }

  // --- Exact requirements (numbers/sizes) ---
  if (NUMBER_PATTERN.test(text)) {
    score += 8;
    signals.push('specific numbers or measurements included');
  }

  // --- Specific error messages ---
  let hasErrorMessage = false;
  for (const rx of ERROR_MESSAGE_PATTERNS) {
    if (rx.test(text)) {
      hasErrorMessage = true;
      break;
    }
  }
  if (hasErrorMessage) {
    score += 8;
    signals.push('specific error message included');
  }

  // --- Code blocks with content ---
  const codeBlocks = text.match(/```[\s\S]*?```/g) ?? [];
  if (codeBlocks.length > 0) {
    const totalCodeLength = codeBlocks.reduce((sum, block) => sum + block.length, 0);
    if (totalCodeLength > 50) {
      score += 8;
      signals.push(`${codeBlocks.length} code block(s) with relevant context`);
    }
  }

  // --- Generic phrases penalty ---
  let genericCount = 0;
  for (const phrase of GENERIC_PHRASES) {
    if (lower.includes(phrase)) genericCount++;
  }
  if (genericCount >= 2) {
    score -= 15;
    signals.push(`${genericCount} generic phrases detected`);
  } else if (genericCount === 1) {
    score -= 8;
    signals.push('1 generic phrase detected');
  }

  // --- No technical references at all ---
  if (techCount === 0 && pathMatches.length === 0 && codeRefs.length === 0 && codeBlocks.length === 0) {
    score -= 10;
    signals.push('no technical references (files, code, technologies)');
  }

  // --- Broad scope penalty ---
  const broadScopePatterns = /\b(entire|whole|all of|everything|the whole)\s+(project|codebase|app|application|system|repo|repository)\b/i;
  if (broadScopePatterns.test(text)) {
    score -= 8;
    signals.push('broad scope reference detected');
  }

  // --- Missing details for short prompts ---
  if (wordCount < 8 && techCount === 0 && pathMatches.length === 0) {
    score -= 10;
    signals.push('very short prompt with no specific details');
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    score >= 80
      ? 'Prompt is highly specific with clear technical references and requirements.'
      : score >= 60
        ? 'Prompt has moderate specificity – adding file paths, code refs, or exact requirements would help.'
        : score >= 40
          ? 'Prompt is somewhat vague – consider adding specific files, functions, or technical details.'
          : 'Prompt is too generic – needs specific targets, technologies, and concrete requirements.';

  return { score, explanation, signals };
}
