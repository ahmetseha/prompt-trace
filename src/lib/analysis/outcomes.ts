import type { Prompt, PromptFile } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptOutcome {
  fileChangeCount: number;
  followUpCount: number;
  sessionContinuationScore: number;
  repeatedLater: boolean;
  abandonmentRisk: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract significant words (length >= 4, lowercased) from a text string. */
function significantWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  return new Set(words);
}

/** Compute Jaccard-like word overlap ratio between two word sets. */
function wordOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------

export function analyzeOutcomes(
  prompt: Prompt,
  sessionPrompts: Prompt[],
  allPrompts: Prompt[],
  promptFiles: PromptFile[],
): PromptOutcome {
  const ts = prompt.timestamp ?? 0;

  // ---- fileChangeCount ----
  const fileChangeCount = promptFiles.length;

  // ---- followUpCount ----
  const followUps = sessionPrompts.filter(
    (p) => p.id !== prompt.id && (p.timestamp ?? 0) > ts,
  );
  const followUpCount = followUps.length;

  // ---- sessionContinuationScore (0-100) ----
  let sessionContinuationScore: number;
  if (followUpCount === 0) {
    sessionContinuationScore = 10;
  } else if (followUpCount <= 2) {
    sessionContinuationScore = 40;
  } else if (followUpCount <= 5) {
    sessionContinuationScore = 65;
  } else {
    sessionContinuationScore = Math.min(90, 65 + followUpCount * 2);
  }
  // Boost if follow-ups touched files (productive)
  const productiveFollowUps = followUps.filter(
    (p) => (p.successScore ?? 0) > 0.4,
  ).length;
  if (productiveFollowUps > 0) {
    sessionContinuationScore = Math.min(
      100,
      sessionContinuationScore + productiveFollowUps * 5,
    );
  }

  // ---- repeatedLater ----
  const promptWords = significantWords(prompt.promptText ?? '');
  let repeatedLater = false;
  if (promptWords.size > 0) {
    for (const other of allPrompts) {
      if (other.id === prompt.id) continue;
      if (other.sessionId === prompt.sessionId) continue; // must be different session
      const otherWords = significantWords(other.promptText ?? '');
      if (wordOverlap(promptWords, otherWords) > 0.5) {
        repeatedLater = true;
        break;
      }
    }
  }

  // ---- abandonmentRisk (0-100) ----
  let abandonmentRisk: number;
  const hasShortResponse =
    !prompt.responsePreview || prompt.responsePreview.length < 80;

  if (followUpCount === 0 && fileChangeCount === 0 && hasShortResponse) {
    abandonmentRisk = 90;
  } else if (followUpCount === 0 && fileChangeCount === 0) {
    abandonmentRisk = 80;
  } else if (followUpCount <= 1 && fileChangeCount === 0) {
    abandonmentRisk = 60;
  } else if (followUpCount <= 2) {
    abandonmentRisk = 45;
  } else if (fileChangeCount > 0 && followUpCount > 2) {
    abandonmentRisk = 15;
  } else {
    abandonmentRisk = 30;
  }

  // Reduce risk if files were changed
  if (fileChangeCount > 0) {
    abandonmentRisk = Math.max(0, abandonmentRisk - fileChangeCount * 5);
  }

  // ---- summary ----
  let summary: string;
  if (abandonmentRisk >= 80) {
    summary = 'Likely abandoned - no follow-up or file changes';
  } else if (abandonmentRisk >= 50) {
    summary = `Uncertain outcome - ${followUpCount} follow-up${followUpCount !== 1 ? 's' : ''}, ${fileChangeCount} file change${fileChangeCount !== 1 ? 's' : ''}`;
  } else if (fileChangeCount > 0 && followUpCount > 2) {
    summary = `Effective - led to ${fileChangeCount} file change${fileChangeCount !== 1 ? 's' : ''} and continued session`;
  } else if (fileChangeCount > 0) {
    summary = `Quick action - ${fileChangeCount} file change${fileChangeCount !== 1 ? 's' : ''} with minimal follow-up`;
  } else if (followUpCount > 4) {
    summary = `Long chain - triggered ${followUpCount} follow-up prompts`;
  } else {
    summary = `Moderate outcome - ${followUpCount} follow-up${followUpCount !== 1 ? 's' : ''}, session continued`;
  }

  if (repeatedLater) {
    summary += ' (repeated in another session)';
  }

  return {
    fileChangeCount,
    followUpCount,
    sessionContinuationScore,
    repeatedLater,
    abandonmentRisk,
    summary,
  };
}
