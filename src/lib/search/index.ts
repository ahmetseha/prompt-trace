import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Prompt } from '@/lib/types';

// ---------------------------------------------------------------------------
// Fuse.js search configuration
// ---------------------------------------------------------------------------

const FUSE_OPTIONS: IFuseOptions<Prompt> = {
  keys: [
    { name: 'promptText', weight: 0.5 },
    { name: 'category', weight: 0.2 },
    { name: 'model', weight: 0.15 },
    { name: 'tags', weight: 0.15 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Create a reusable Fuse instance for full-text search across prompts.
 *
 * ```ts
 * const fuse = createPromptSearch(prompts);
 * const results = fuse.search('refactor hook');
 * ```
 */
export function createPromptSearch(prompts: Prompt[]): Fuse<Prompt> {
  return new Fuse(prompts, FUSE_OPTIONS);
}

/**
 * One-shot convenience helper: creates a Fuse index and immediately searches.
 * Returns matched `Prompt` objects sorted by relevance.
 */
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  if (!query || query.trim().length === 0) return prompts;

  const fuse = createPromptSearch(prompts);
  return fuse.search(query).map((result) => result.item);
}
