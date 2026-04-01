// ---------------------------------------------------------------------------
// Ambiguity-score calculator  (0–100)
// Higher = LESS ambiguous = better.
// ---------------------------------------------------------------------------

const UNCLEAR_REFERENCES = [
  /\b(it|that|this thing|the thing|the stuff|those things)\b/gi,
];

const CONTRADICTORY_PATTERNS = [
  /\b(but also|however|on the other hand|actually|wait|no,)\b/i,
  /\b(both .+ and|either .+ or .+ or)\b/i,
];

const ALTERNATIVE_WITHOUT_PREFERENCE = /\b(or)\b/gi;

const SPECIFIC_VERB_PATTERNS = [
  /\b(add|create|update|remove|fix|refactor|implement|write|generate|build|configure|set up|migrate|convert|test|deploy|optimize|move|rename|extract|replace|delete|install|integrate|validate|parse)\b/i,
];

/**
 * Calculate an ambiguity score (0–100) for a prompt.
 * Higher means LESS ambiguous (better).
 */
export function calculateAmbiguityScore(promptText: string): {
  score: number;
  explanation: string;
  signals: string[];
} {
  if (!promptText || !promptText.trim()) {
    return { score: 0, explanation: 'Empty prompt is fully ambiguous.', signals: ['empty prompt'] };
  }

  const text = promptText.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const signals: string[] = [];

  let score = 60;

  // --- Single clear request vs multiple unrelated requests ---
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const imperativeSentences = sentences.filter((s) =>
    /^\s*(add|create|fix|make|update|remove|change|write|implement|generate|build|deploy|refactor|convert|test|configure|set up|replace|delete|install|move|rename|also|then|and)\b/i.test(s),
  );

  if (imperativeSentences.length === 1 && sentences.length <= 3) {
    score += 12;
    signals.push('single clear request identified');
  } else if (imperativeSentences.length > 3) {
    score -= 10;
    signals.push(`${imperativeSentences.length} separate imperative requests – may cause confusion`);
  }

  // --- Specific verbs ---
  let hasSpecificVerb = false;
  for (const rx of SPECIFIC_VERB_PATTERNS) {
    if (rx.test(text)) {
      hasSpecificVerb = true;
      break;
    }
  }
  if (hasSpecificVerb) {
    score += 8;
    signals.push('specific action verb used');
  } else {
    score -= 10;
    signals.push('no specific action verb found');
  }

  // --- Defined scope ---
  const hasFilePath = /(?:\.{0,2}\/[\w\-.]+(?:\/[\w\-.]+)+)/g.test(text);
  const hasBacktickRef = /`[^`]+`/.test(text);
  const hasComponentName = /\b[A-Z][a-zA-Z]+(?:Component|Page|View|Service|Controller|Module|Hook|Provider|Store|Reducer|Action|Slice)\b/.test(text);
  if (hasFilePath || hasBacktickRef || hasComponentName) {
    score += 8;
    signals.push('scope is defined with specific references');
  } else if (wordCount > 20) {
    score -= 5;
    signals.push('no specific scope references for a detailed prompt');
  }

  // --- "Or" alternatives without preference ---
  const orMatches = text.match(ALTERNATIVE_WITHOUT_PREFERENCE) ?? [];
  // Only penalize "or" when it seems to offer alternatives without choosing
  const meaningfulOrs = orMatches.filter((_, idx) => {
    // Check if there's a preference indicator nearby
    return !/\b(prefer|ideally|better|recommended|use)\b/i.test(text);
  });
  if (meaningfulOrs.length >= 2) {
    score -= 10;
    signals.push(`${meaningfulOrs.length} "or" alternatives without clear preference`);
  } else if (meaningfulOrs.length === 1) {
    score -= 4;
    signals.push('1 "or" alternative without clear preference');
  }

  // --- Unclear references ---
  let unclearRefCount = 0;
  for (const rx of UNCLEAR_REFERENCES) {
    const matches = text.match(rx) ?? [];
    unclearRefCount += matches.length;
  }
  if (unclearRefCount > 4) {
    score -= 15;
    signals.push(`${unclearRefCount} unclear references ("it", "that", "this thing")`);
  } else if (unclearRefCount > 2) {
    score -= 8;
    signals.push(`${unclearRefCount} unclear references`);
  } else if (unclearRefCount > 0) {
    score -= 3;
    signals.push(`${unclearRefCount} unclear reference(s)`);
  }

  // --- Contradictory instructions ---
  let contradictionCount = 0;
  for (const rx of CONTRADICTORY_PATTERNS) {
    if (rx.test(text)) contradictionCount++;
  }
  if (contradictionCount >= 2) {
    score -= 12;
    signals.push('multiple contradictory or backtracking phrases');
  } else if (contradictionCount === 1) {
    score -= 5;
    signals.push('possible contradictory or backtracking phrase');
  }

  // --- Multiple unrelated topics ---
  const topicKeywords = extractTopicKeywords(text);
  const topicClusters = clusterTopics(topicKeywords);
  if (topicClusters > 3) {
    score -= 10;
    signals.push(`appears to cover ${topicClusters}+ unrelated topics`);
  } else if (topicClusters <= 1) {
    score += 5;
    signals.push('focused on a single topic');
  }

  // --- Very short = could be ambiguous or could be clear ---
  if (wordCount < 5) {
    score -= 8;
    signals.push('very short – may be ambiguous due to lack of detail');
  }

  // --- Explicit target boosts clarity ---
  if (/\b(in|at|for|to)\s+`[^`]+`/.test(text) || /\b(in|at|for|to)\s+[\w/\-.]+\.\w+/.test(text)) {
    score += 5;
    signals.push('explicit target location specified');
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    score >= 80
      ? 'Prompt is clear and unambiguous with a single focused request.'
      : score >= 60
        ? 'Prompt is mostly clear but has some ambiguous elements.'
        : score >= 40
          ? 'Prompt has notable ambiguity – unclear references, multiple requests, or missing scope.'
          : 'Prompt is highly ambiguous – needs a single clear request with defined scope.';

  return { score, explanation, signals };
}

/**
 * Extract broad topic keywords from text.
 */
function extractTopicKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'it', 'this', 'that', 'i', 'you',
    'we', 'they', 'and', 'or', 'but', 'not', 'so', 'if', 'then', 'please',
    'also', 'just', 'make', 'get', 'use', 'need', 'want', 'like',
  ]);

  return text
    .toLowerCase()
    .replace(/`[^`]*`/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w) && /^[a-z]+$/.test(w));
}

/**
 * Very rough topic clustering: count groups of related words
 * that don't co-occur near each other.
 */
function clusterTopics(keywords: string[]): number {
  if (keywords.length < 3) return 1;

  // Simple approach: look at unique word stems in different thirds of the text
  const third = Math.ceil(keywords.length / 3);
  const segments = [
    new Set(keywords.slice(0, third)),
    new Set(keywords.slice(third, third * 2)),
    new Set(keywords.slice(third * 2)),
  ];

  let distinctSegments = 0;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].size === 0) continue;
    let isDistinct = true;
    for (let j = 0; j < i; j++) {
      let overlap = 0;
      for (const w of segments[i]) {
        if (segments[j].has(w)) overlap++;
      }
      if (overlap > 0) {
        isDistinct = false;
        break;
      }
    }
    if (isDistinct) distinctSegments++;
  }

  return Math.max(1, distinctSegments);
}
