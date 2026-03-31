export { calculateReuseScore } from './reuse';
export { calculateSuccessScore } from './success';

import { calculateReuseScore } from './reuse';
import { calculateSuccessScore } from './success';

/**
 * Compute both reuse and success scores for a prompt in a single call.
 */
export function scorePrompt(prompt: {
  promptText: string;
  category: string;
  intent: string;
  filesCount: number;
  responsePreview?: string;
}): { reuseScore: number; successScore: number } {
  return {
    reuseScore: calculateReuseScore({
      promptText: prompt.promptText,
      category: prompt.category,
      intent: prompt.intent,
    }),
    successScore: calculateSuccessScore({
      promptText: prompt.promptText,
      filesCount: prompt.filesCount,
      responsePreview: prompt.responsePreview,
    }),
  };
}
