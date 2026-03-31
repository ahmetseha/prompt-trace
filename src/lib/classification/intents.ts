import type { PromptIntent } from '@/lib/types';

// ---------------------------------------------------------------------------
// Heuristic intent classifier
// ---------------------------------------------------------------------------

const QUESTION_STARTERS = /^\s*(who|what|when|where|why|how|is|are|do|does|did|can|could|should|would|will|shall)\b/i;
const IMPERATIVE_STARTERS = /^\s*(add|create|fix|make|update|remove|change|delete|move|rename|set|install|configure|run|start|stop|build|deploy|write|implement|use|apply|put|enable|disable|insert|replace|merge|push|pull|fetch|commit|revert)\b/i;

interface IntentRule {
  intent: PromptIntent;
  keywords: string[];
  patterns?: RegExp[];
  /** Higher priority rules are checked first; first match above threshold wins. */
  priority: number;
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'compare',
    keywords: ['compare', 'difference', 'vs', 'versus', 'which is better', 'pros and cons', 'trade-off'],
    patterns: [/\bvs\.?\b/i, /\bwhich\s+(is|one)\s+better\b/i, /\bdifference\s+between\b/i],
    priority: 90,
  },
  {
    intent: 'transform',
    keywords: ['convert', 'transform', 'migrate', 'translate', 'refactor to', 'port to', 'change from', 'switch to'],
    patterns: [/\bconvert\s+.+\s+to\b/i, /\bmigrate\s+(from|to)\b/i, /\brefactor\s+to\b/i],
    priority: 85,
  },
  {
    intent: 'plan',
    keywords: ['plan', 'design', 'architect', 'outline', 'strategy', 'roadmap', 'approach'],
    patterns: [/\bplan\s+(for|out|how)\b/i, /\bdesign\s+(a|the)\b/i],
    priority: 80,
  },
  {
    intent: 'explain',
    keywords: ['explain', 'tell me about', 'what is', 'what are', 'how does', 'why does', 'describe', 'walk me through'],
    patterns: [/\bexplain\b/i, /\bhow\s+does\b/i, /\bwhat\s+(is|are)\b/i, /\btell\s+me\s+(about|how|why)\b/i],
    priority: 70,
  },
  {
    intent: 'fix',
    keywords: ['fix', 'resolve', 'repair', 'patch', 'correct', 'hotfix'],
    patterns: [/\bfix\s+(the|this|a|my)\b/i, /\bresolve\s+(the|this|a)\b/i],
    priority: 75,
  },
  {
    intent: 'generate',
    keywords: ['generate', 'create', 'write', 'build from scratch', 'scaffold', 'bootstrap', 'new'],
    patterns: [/\bgenerate\s+(a|an|the)\b/i, /\bcreate\s+(a|an|the|new)\b/i, /\bwrite\s+(a|an|the|me)\b/i],
    priority: 60,
  },
  {
    intent: 'ask',
    keywords: [],
    patterns: [QUESTION_STARTERS, /\?\s*$/],
    priority: 50,
  },
  {
    intent: 'instruct',
    keywords: [],
    patterns: [IMPERATIVE_STARTERS],
    priority: 40,
  },
];

/**
 * Classify the intent of a prompt using keyword and pattern heuristics.
 * Rules are evaluated in priority order; the first strong match wins.
 * Falls back to `'instruct'` for imperative prompts or `'ask'` otherwise.
 */
export function classifyIntent(promptText: string): PromptIntent {
  if (!promptText || promptText.trim().length === 0) return 'ask';

  const text = promptText.trim();
  const lower = text.toLowerCase();

  // Sort by priority descending – higher priority checked first
  const sorted = [...INTENT_RULES].sort((a, b) => b.priority - a.priority);

  let bestIntent: PromptIntent | null = null;
  let bestScore = 0;

  for (const rule of sorted) {
    let score = 0;

    // Keyword hits
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 2;
      }
    }

    // Pattern hits
    if (rule.patterns) {
      for (const rx of rule.patterns) {
        if (rx.test(text)) {
          score += 3;
        }
      }
    }

    // Priority-weighted: multiply by a small priority factor
    const weighted = score * (1 + rule.priority / 100);

    if (weighted > bestScore) {
      bestScore = weighted;
      bestIntent = rule.intent;
    }
  }

  // Minimum threshold – need at least some signal
  if (bestIntent && bestScore >= 2) {
    return bestIntent;
  }

  // Fallback: check question vs imperative
  if (/\?\s*$/.test(text) || QUESTION_STARTERS.test(text)) {
    return 'ask';
  }
  if (IMPERATIVE_STARTERS.test(text)) {
    return 'instruct';
  }

  return 'ask';
}
