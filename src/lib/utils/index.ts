import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import crypto from 'crypto';

/**
 * Merge Tailwind CSS classes with clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID using crypto.randomUUID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Format a unix-ms timestamp into a readable date string.
 */
export function formatDate(timestamp: number, pattern = 'MMM d, yyyy HH:mm'): string {
  return format(new Date(timestamp), pattern);
}

/**
 * Format a unix-ms timestamp as a relative time string (e.g. "3 hours ago").
 */
export function formatRelativeDate(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Truncate a string to a given length, appending an ellipsis if truncated.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '\u2026';
}

/**
 * Rough token estimate: split on whitespace and divide by 0.75.
 * This approximates the typical sub-word tokenization ratio.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 0.75);
}

/** Cost per 1K tokens (input) for common models. */
const MODEL_COST_PER_1K: Record<string, number> = {
  'gpt-4': 0.03,
  'gpt-4-turbo': 0.01,
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  'gpt-3.5-turbo': 0.0005,
  'claude-3-opus': 0.015,
  'claude-3.5-sonnet': 0.003,
  'claude-3-sonnet': 0.003,
  'claude-3-haiku': 0.00025,
  'claude-3.5-haiku': 0.0008,
  'claude-opus-4': 0.015,
  'claude-sonnet-4': 0.003,
  'gemini-pro': 0.00125,
  'gemini-1.5-pro': 0.00125,
  'gemini-2.0-flash': 0.0001,
  'codex-mini': 0.0015,
};

/**
 * Estimate the cost in USD for a given number of tokens and model.
 * Falls back to a conservative default if the model is unknown.
 */
export function estimateCost(tokens: number, model: string): number {
  const normalized = model.toLowerCase().trim();

  // Try exact match first, then prefix match
  let costPer1K = MODEL_COST_PER_1K[normalized];
  if (costPer1K === undefined) {
    const key = Object.keys(MODEL_COST_PER_1K).find((k) => normalized.includes(k));
    costPer1K = key ? MODEL_COST_PER_1K[key] : 0.003; // default fallback
  }

  return (tokens / 1000) * costPer1K;
}

/**
 * Convert a string to a URL-safe slug.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
