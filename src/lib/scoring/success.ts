// ---------------------------------------------------------------------------
// Success-score calculator  (0–100)
// Heuristic proxy – we don't have explicit user feedback so we infer from
// structural signals available at ingest time.
// ---------------------------------------------------------------------------

const ACTION_INTENTS = new Set(['instruct', 'fix', 'generate', 'transform']);

const CLEAR_PROMPT_PATTERNS = [
  /\b(please|must|should|need to|make sure)\b/i,
  /\b(step\s*\d|first|then|finally|after that)\b/i,
  /^\s*[\d\-\*]\s/m, // numbered / bulleted list
];

const VAGUE_PATTERNS = [
  /\b(something|stuff|things|whatever|idk)\b/i,
  /^.{0,15}$/,  // very short
];

/**
 * Calculate a success score (0–100) as a heuristic proxy for prompt effectiveness.
 */
export function calculateSuccessScore(prompt: {
  promptText: string;
  filesCount: number;
  responsePreview?: string;
}): number {
  const { promptText, filesCount, responsePreview } = prompt;

  let score = 0;

  // -----------------------------------------------------------------------
  // 1. File changes (+30 max)
  // -----------------------------------------------------------------------
  if (filesCount > 0) {
    // More files touched generally indicates the AI acted on the prompt
    score += Math.min(filesCount * 10, 30);
  }

  // -----------------------------------------------------------------------
  // 2. Substantial response (+20 max)
  // -----------------------------------------------------------------------
  if (responsePreview) {
    const len = responsePreview.length;
    if (len > 500) {
      score += 20;
    } else if (len > 100) {
      score += 15;
    } else if (len > 30) {
      score += 8;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Prompt clarity (+20 max)
  // -----------------------------------------------------------------------
  if (promptText) {
    let clarity = 0;
    for (const rx of CLEAR_PROMPT_PATTERNS) {
      if (rx.test(promptText)) clarity += 5;
    }
    // Penalty for vague language
    for (const rx of VAGUE_PATTERNS) {
      if (rx.test(promptText)) clarity -= 5;
    }
    score += Math.max(0, Math.min(20, clarity));
  }

  // -----------------------------------------------------------------------
  // 4. Action intent (+15)
  // -----------------------------------------------------------------------
  if (promptText) {
    const lower = promptText.trim().toLowerCase();
    // Quick imperative check
    const startsImperative = /^\s*(add|create|fix|make|update|remove|change|write|implement|generate|build|deploy|refactor|convert|test)\b/i.test(lower);
    if (startsImperative) {
      score += 15;
    } else if (/\b(fix|create|generate|implement|write|build)\b/i.test(lower)) {
      score += 10;
    }
  }

  // -----------------------------------------------------------------------
  // 5. Medium prompt length (+15 max)
  // -----------------------------------------------------------------------
  if (promptText) {
    const wordCount = promptText.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 10 && wordCount <= 150) {
      score += 15;
    } else if (wordCount >= 5 && wordCount <= 300) {
      score += 8;
    } else if (wordCount < 5) {
      score += 0; // too short
    } else {
      score += 5; // very long
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
