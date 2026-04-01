import type { SourceAdapter } from "./types";
import { cursorAdapter } from "./cursor";
import { claudeCodeAdapter } from "./claude-code";
import { codexAdapter } from "./codex";

export type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";

export const adapters: Record<string, SourceAdapter> = {
  cursor: cursorAdapter,
  "claude-code": claudeCodeAdapter,
  "codex-cli": codexAdapter,
};

export function getAdapter(type: string): SourceAdapter | undefined {
  return adapters[type];
}

export function getAllAdapters(): SourceAdapter[] {
  return Object.values(adapters);
}
