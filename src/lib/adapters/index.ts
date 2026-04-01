import type { SourceAdapter } from "./types";
import { cursorAdapter } from "./cursor";
import { claudeCodeAdapter } from "./claude-code";
import { codexAdapter } from "./codex";
import { geminiCliAdapter } from "./gemini-cli";
import { copilotCliAdapter } from "./copilot-cli";
import { gooseAdapter } from "./goose";
import { vscodeAdapter } from "./vscode";
import { windsurfAdapter } from "./windsurf";
import { zedAdapter } from "./zed";
import { kiroAdapter } from "./kiro";
import { opencodeAdapter } from "./opencode";
import { antigravityAdapter } from "./antigravity";
import { commandCodeAdapter } from "./command-code";

export type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";

export const adapters: Record<string, SourceAdapter> = {
  cursor: cursorAdapter,
  "claude-code": claudeCodeAdapter,
  "codex-cli": codexAdapter,
  "gemini-cli": geminiCliAdapter,
  "copilot-cli": copilotCliAdapter,
  goose: gooseAdapter,
  vscode: vscodeAdapter,
  windsurf: windsurfAdapter,
  zed: zedAdapter,
  kiro: kiroAdapter,
  opencode: opencodeAdapter,
  antigravity: antigravityAdapter,
  "command-code": commandCodeAdapter,
};

export function getAdapter(type: string): SourceAdapter | undefined {
  return adapters[type];
}

export function getAllAdapters(): SourceAdapter[] {
  return Object.values(adapters);
}
