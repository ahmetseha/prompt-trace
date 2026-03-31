import type { PromptCategory, PromptIntent } from '@/lib/types';

export { classifyCategory } from './categories';
export { classifyIntent } from './intents';

import { classifyCategory } from './categories';
import { classifyIntent } from './intents';

/**
 * Classify a prompt into both a category and an intent in a single call.
 */
export function classifyPrompt(text: string): { category: PromptCategory; intent: PromptIntent } {
  return {
    category: classifyCategory(text),
    intent: classifyIntent(text),
  };
}
