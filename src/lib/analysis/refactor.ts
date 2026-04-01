// ---------------------------------------------------------------------------
// Prompt Analysis & Refactoring
// Runs all analysis, generates strengths/weaknesses/suggestions, and
// produces improved + template versions of the prompt.
// ---------------------------------------------------------------------------

import { calculateClarityScore } from './clarity';
import { calculateSpecificityScore } from './specificity';
import { calculateConstraintScore } from './constraints';
import { calculateContextEfficiency } from './context-efficiency';
import { calculateAmbiguityScore } from './ambiguity';
import { calculateOptimizationScore } from './optimization';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoreResult {
  score: number;
  explanation: string;
  signals: string[];
}

export interface PromptAnalysis {
  scores: {
    clarity: ScoreResult;
    specificity: ScoreResult;
    constraints: ScoreResult;
    contextEfficiency: ScoreResult;
    ambiguity: ScoreResult;
    optimization: ScoreResult;
  };
  strengths: string[];
  weaknesses: string[];
  antiPatterns: string[];
  suggestions: string[];
  improvedVersion: string | null;
  templateVersion: string | null;
  whenToUse: string;
}

// ---------------------------------------------------------------------------
// Anti-pattern definitions
// ---------------------------------------------------------------------------

const ANTI_PATTERNS: Array<{ pattern: RegExp; name: string; suggestion: string }> = [
  {
    pattern: /^.{0,15}$/,
    name: 'Too terse',
    suggestion: 'Add more context about what you want and where.',
  },
  {
    pattern: /\b(fix it|make it work|help me)\b/i,
    name: 'Vague request',
    suggestion: 'Specify what is broken and what the expected behavior should be.',
  },
  {
    pattern: /\b(do everything|change everything|update all)\b/i,
    name: 'Scope explosion',
    suggestion: 'Break into smaller, focused requests targeting specific files or components.',
  },
  {
    pattern: /\?.*\?.*\?/s,
    name: 'Question overload',
    suggestion: 'Focus on one question at a time or number your questions by priority.',
  },
  {
    pattern: /\b(idk|i guess|whatever|not sure|maybe just)\b/i,
    name: 'Uncertain language',
    suggestion: 'Be decisive about what you want – the AI will follow your lead.',
  },
  {
    pattern: /```[\s\S]{2000,}```/,
    name: 'Massive code dump',
    suggestion: 'Include only the relevant code snippet, not entire files.',
  },
  {
    pattern: /\b(also|and also|oh and|btw|by the way)\b.*\b(also|and also|oh and|btw|by the way)\b/i,
    name: 'Scope creep mid-prompt',
    suggestion: 'Keep each prompt focused on one task. Send follow-up prompts for additional work.',
  },
  {
    pattern: /^(can you|could you|would you|is it possible to)\b/i,
    name: 'Asking permission instead of instructing',
    suggestion: 'Use direct imperatives: "Add..." instead of "Can you add...".',
  },
];

// ---------------------------------------------------------------------------
// Vague-to-specific verb mapping
// ---------------------------------------------------------------------------

const VERB_IMPROVEMENTS: Record<string, string> = {
  'fix it': 'fix the [specific issue]',
  'make it work': 'ensure [component] correctly [expected behavior]',
  'make it better': 'improve [aspect] by [specific change]',
  'make it fast': 'optimize [component] for performance by reducing [metric]',
  'make it nice': 'improve the UI/UX of [component] with [specific improvements]',
  'clean up': 'refactor [component] to improve readability and reduce duplication',
  'do something': '[specific action] on [specific target]',
  'help me': '[specific action verb]',
  'change it': 'update [component] to [new behavior]',
  'update this': 'update [specific file/component] to [specific change]',
  'improve this': 'improve [specific aspect] of [component] by [method]',
};

const PERMISSION_TO_IMPERATIVE: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^can you\s+/i, replacement: '' },
  { pattern: /^could you\s+/i, replacement: '' },
  { pattern: /^would you\s+/i, replacement: '' },
  { pattern: /^is it possible to\s+/i, replacement: '' },
  { pattern: /^would it be possible to\s+/i, replacement: '' },
  { pattern: /^do you think you could\s+/i, replacement: '' },
];

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Run full prompt analysis: score all dimensions, detect patterns,
 * generate suggestions, and produce improved/template versions.
 */
export function analyzePrompt(promptText: string): PromptAnalysis {
  if (!promptText || !promptText.trim()) {
    return {
      scores: {
        clarity: { score: 0, explanation: 'Empty prompt.', signals: [] },
        specificity: { score: 0, explanation: 'Empty prompt.', signals: [] },
        constraints: { score: 0, explanation: 'Empty prompt.', signals: [] },
        contextEfficiency: { score: 0, explanation: 'Empty prompt.', signals: [] },
        ambiguity: { score: 0, explanation: 'Empty prompt.', signals: [] },
        optimization: { score: 0, explanation: 'Empty prompt.', signals: [] },
      },
      strengths: [],
      weaknesses: ['Prompt is empty.'],
      antiPatterns: ['Empty prompt'],
      suggestions: ['Write a prompt with a clear action, target, and constraints.'],
      improvedVersion: null,
      templateVersion: null,
      whenToUse: 'N/A',
    };
  }

  const text = promptText.trim();

  // --- Compute all scores ---
  const clarity = calculateClarityScore(text);
  const specificity = calculateSpecificityScore(text);
  const constraints = calculateConstraintScore(text);
  const contextEfficiency = calculateContextEfficiency(text);
  const ambiguity = calculateAmbiguityScore(text);
  const optimization = calculateOptimizationScore(text);

  const scores = { clarity, specificity, constraints, contextEfficiency, ambiguity, optimization };

  // --- Collect strengths ---
  const strengths: string[] = [];
  if (clarity.score >= 70) strengths.push('Clear and well-structured prompt.');
  if (specificity.score >= 70) strengths.push('Specific technical references and requirements.');
  if (constraints.score >= 70) strengths.push('Well-defined constraints and output requirements.');
  if (contextEfficiency.score >= 70) strengths.push('Efficient use of context – concise but complete.');
  if (ambiguity.score >= 70) strengths.push('Low ambiguity – single focused request.');
  if (optimization.score >= 80) strengths.push('Overall well-optimized prompt.');

  // Add signal-based strengths
  for (const s of clarity.signals) {
    if (s.includes('numbered steps')) strengths.push('Uses numbered steps for clarity.');
    if (s.includes('explicit output format')) strengths.push('Specifies output format.');
  }
  for (const s of specificity.signals) {
    if (s.includes('file path')) strengths.push('References specific file paths.');
    if (s.includes('code reference')) strengths.push('Uses inline code references.');
  }

  // --- Collect weaknesses ---
  const weaknesses: string[] = [];
  if (clarity.score < 50) weaknesses.push('Prompt lacks clarity – missing action verbs or structure.');
  if (specificity.score < 50) weaknesses.push('Too vague – needs specific files, functions, or technologies.');
  if (constraints.score < 50) weaknesses.push('No output constraints – add format, size, or behavior limits.');
  if (contextEfficiency.score < 50) weaknesses.push('Poor context efficiency – too much, too little, or unfocused.');
  if (ambiguity.score < 50) weaknesses.push('High ambiguity – unclear references or multiple unrelated requests.');

  for (const s of clarity.signals) {
    if (s.includes('vague word')) weaknesses.push('Contains vague language ("something", "stuff", "maybe").');
  }
  for (const s of contextEfficiency.signals) {
    if (s.includes('excessive code')) weaknesses.push('Too much code pasted – trim to relevant snippets.');
    if (s.includes('too terse')) weaknesses.push('Too short – add necessary context.');
  }

  // --- Detect anti-patterns ---
  const antiPatterns: string[] = [];
  for (const ap of ANTI_PATTERNS) {
    if (ap.pattern.test(text)) {
      antiPatterns.push(ap.name);
    }
  }

  // --- Generate suggestions ---
  const suggestions: string[] = [];
  for (const ap of ANTI_PATTERNS) {
    if (ap.pattern.test(text)) {
      suggestions.push(ap.suggestion);
    }
  }

  if (clarity.score < 60 && !suggestions.some((s) => s.includes('action'))) {
    suggestions.push('Start with a clear action verb (e.g., "Add", "Fix", "Create", "Update").');
  }
  if (specificity.score < 60) {
    suggestions.push('Reference specific files, functions, or components by name.');
  }
  if (constraints.score < 50) {
    suggestions.push('Add output constraints: format, size limits, or what to preserve.');
  }
  if (contextEfficiency.score < 50 && contextEfficiency.score > 20) {
    suggestions.push('Balance context: include relevant code snippets but trim unnecessary parts.');
  }
  if (ambiguity.score < 60) {
    suggestions.push('Focus on a single request per prompt. Use follow-ups for additional tasks.');
  }

  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)];

  // --- Generate improved version ---
  const improvedVersion = generateImprovedVersion(text, scores);

  // --- Generate template version ---
  const templateVersion = generateTemplateVersion(text);

  // --- Generate whenToUse ---
  const whenToUse = generateWhenToUse(text);

  return {
    scores,
    strengths: dedupe(strengths),
    weaknesses: dedupe(weaknesses),
    antiPatterns,
    suggestions: uniqueSuggestions,
    improvedVersion,
    templateVersion,
    whenToUse,
  };
}

// ---------------------------------------------------------------------------
// Improved version generation
// ---------------------------------------------------------------------------

function generateImprovedVersion(
  text: string,
  scores: Record<string, ScoreResult>,
): string | null {
  // If already good, no improvement needed
  const avgScore =
    (scores.clarity.score +
      scores.specificity.score +
      scores.constraints.score +
      scores.contextEfficiency.score +
      scores.ambiguity.score) /
    5;

  if (avgScore >= 80) return null;

  let improved = text;

  // 1. Replace permission questions with imperatives
  for (const { pattern, replacement } of PERMISSION_TO_IMPERATIVE) {
    improved = improved.replace(pattern, replacement);
  }

  // Capitalize first letter after removing permission prefix
  if (improved.length > 0 && improved[0] !== improved[0].toUpperCase()) {
    improved = improved[0].toUpperCase() + improved.slice(1);
  }

  // 2. Replace vague phrases
  const lowerImproved = improved.toLowerCase();
  for (const [vague, specific] of Object.entries(VERB_IMPROVEMENTS)) {
    if (lowerImproved.includes(vague)) {
      const rx = new RegExp(escapeRegex(vague), 'gi');
      improved = improved.replace(rx, specific);
    }
  }

  // 3. Add "Please" if no politeness markers and prompt is an imperative
  const hasPoliteness = /\b(please|thanks|thank you|kindly)\b/i.test(improved);
  const startsImperative = /^\s*[A-Z][a-z]+\b/.test(improved);
  if (!hasPoliteness && startsImperative) {
    improved = 'Please ' + improved[0].toLowerCase() + improved.slice(1);
  }

  // 4. Add output format hint if missing
  if (scores.constraints.score < 50) {
    const hasFormat = /\b(format|output|return|respond)\s+(as|in|with)\b/i.test(improved);
    if (!hasFormat) {
      improved = improved.trimEnd();
      if (!improved.endsWith('.')) improved += '.';
      improved += '\n\nOutput format: [specify desired format, e.g., code only, with explanation, as a list]';
    }
  }

  // 5. Add constraints hint if none exist
  if (scores.constraints.score < 30) {
    improved += '\n\nConstraints: [specify what to preserve, avoid, or limit]';
  }

  // 6. Structure multi-part requests with numbers
  const sentences = improved
    .split(/(?<=[.!])\s+/)
    .filter((s) => s.trim().length > 5);
  const imperatives = sentences.filter((s) =>
    /^\s*(add|create|fix|make|update|remove|change|write|implement|generate|build|also|then|and\s+\w+)\b/i.test(s),
  );

  if (imperatives.length >= 3 && !/^\s*\d+[\.\)]/m.test(improved)) {
    // Restructure as numbered list
    let restructured = '';
    let stepNum = 1;
    let nonImperative = '';

    for (const sentence of sentences) {
      const isImperative = /^\s*(add|create|fix|make|update|remove|change|write|implement|generate|build|also|then|and\s+\w+)\b/i.test(sentence);
      if (isImperative) {
        if (nonImperative) {
          restructured += nonImperative.trim() + '\n\n';
          nonImperative = '';
        }
        // Clean up transitional words at start
        const cleaned = sentence.replace(/^\s*(also|then|and)\s+/i, '').trim();
        restructured += `${stepNum}. ${cleaned}\n`;
        stepNum++;
      } else {
        nonImperative += sentence + ' ';
      }
    }

    if (nonImperative.trim()) {
      restructured = nonImperative.trim() + '\n\n' + restructured;
    }

    if (stepNum > 1) {
      // Preserve any trailing format/constraints we added
      const trailingHints = improved.match(/\n\n(Output format:[\s\S]*|Constraints:[\s\S]*)$/);
      improved = restructured.trimEnd();
      if (trailingHints) {
        improved += '\n' + trailingHints[0];
      }
    }
  }

  // 7. Remove excessive context noise (repeated whitespace, etc.)
  improved = improved.replace(/\n{3,}/g, '\n\n').trim();

  // If nothing changed meaningfully, return null
  if (normalizeWhitespace(improved) === normalizeWhitespace(text)) {
    return null;
  }

  return improved;
}

// ---------------------------------------------------------------------------
// Template version generation
// ---------------------------------------------------------------------------

function generateTemplateVersion(text: string): string | null {
  let template = text;

  // Replace file paths with [FILE_PATH]
  template = template.replace(
    /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)*\.\w+)/g,
    '[FILE_PATH]',
  );
  template = template.replace(
    /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)+)/g,
    '[FILE_PATH]',
  );
  template = template.replace(
    /[A-Z]:\\[\w\-.]+(?:\\[\w\-.]+)*/g,
    '[FILE_PATH]',
  );

  // Replace component/function names in backticks with [COMPONENT]
  template = template.replace(
    /`[A-Z][a-zA-Z0-9]*(?:Component|Page|View|Service|Controller|Module|Hook|Provider|Store|Reducer|Action|Slice)`/g,
    '`[COMPONENT]`',
  );
  template = template.replace(
    /`[a-z][a-zA-Z0-9]*(?:Function|Handler|Callback|Middleware|Helper|Util)`/g,
    '`[FUNCTION]`',
  );

  // Replace specific PascalCase names (likely component/class names) in backticks
  template = template.replace(
    /`[A-Z][a-zA-Z0-9]{3,}`/g,
    '`[COMPONENT]`',
  );

  // Replace error messages (in backticks or after "error:")
  template = template.replace(
    /`(?:Error|TypeError|ReferenceError|SyntaxError|Cannot)[^`]*`/g,
    '`[ERROR_MESSAGE]`',
  );
  template = template.replace(
    /(error:\s*).+$/gim,
    '$1[ERROR_MESSAGE]',
  );

  // Replace specific version numbers
  template = template.replace(
    /\bv?\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?\b/g,
    '[VERSION]',
  );

  // Replace URLs
  template = template.replace(
    /https?:\/\/[^\s)]+/g,
    '[URL]',
  );

  // Consolidate repeated placeholders
  template = template.replace(/\[FILE_PATH\](?:\s*(?:and|,)\s*\[FILE_PATH\])+/g, '[FILE_PATH(s)]');
  template = template.replace(/\[COMPONENT\](?:\s*(?:and|,)\s*\[COMPONENT\])+/g, '[COMPONENT(s)]');

  // If nothing was replaced, no template is useful
  if (normalizeWhitespace(template) === normalizeWhitespace(text)) {
    return null;
  }

  return template.trim();
}

// ---------------------------------------------------------------------------
// When-to-use summary
// ---------------------------------------------------------------------------

function generateWhenToUse(text: string): string {
  const lower = text.toLowerCase();

  // Detect primary action
  const actionMatch = lower.match(
    /\b(add|create|update|remove|fix|refactor|implement|write|generate|build|configure|set up|migrate|convert|test|deploy|optimize|move|rename|extract|replace|delete|install|integrate|debug)\b/,
  );
  const action = actionMatch ? actionMatch[1] : 'work on';

  // Detect target type
  let target = 'code';
  if (/\b(component|widget|ui|button|form|modal|dialog|page|view|layout)\b/i.test(text)) {
    target = 'UI component';
  } else if (/\b(api|endpoint|route|controller|handler|middleware)\b/i.test(text)) {
    target = 'API endpoint';
  } else if (/\b(test|spec|assertion|expect|describe|it\()\b/i.test(text)) {
    target = 'test';
  } else if (/\b(style|css|tailwind|theme|color|font|layout|responsive)\b/i.test(text)) {
    target = 'styling';
  } else if (/\b(database|schema|migration|model|table|query|index)\b/i.test(text)) {
    target = 'database schema';
  } else if (/\b(config|configuration|env|environment|setting|option)\b/i.test(text)) {
    target = 'configuration';
  } else if (/\b(error|bug|issue|crash|fail|broken|wrong)\b/i.test(text)) {
    target = 'bug';
  } else if (/\b(function|method|class|module|service|util|helper)\b/i.test(text)) {
    target = 'function or module';
  } else if (/\b(type|interface|schema|validation)\b/i.test(text)) {
    target = 'type definition';
  }

  return `When you need to ${action} a ${target}.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}
