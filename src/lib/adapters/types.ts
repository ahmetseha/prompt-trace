import type { SourceType, Prompt } from "@/lib/types";

export interface SourceAdapter {
  id: string;
  name: string;
  type: SourceType;
  description: string;
  detect: () => Promise<boolean>;
  getDefaultPath: () => string;
  parse: (basePath: string) => Promise<ParsedPrompt[]>;
  healthCheck: () => Promise<AdapterHealth>;
}

export interface ParsedPrompt {
  externalId?: string;
  sessionId?: string;
  projectName?: string;
  projectPath?: string;
  timestamp: number;
  promptText: string;
  responsePreview?: string;
  model?: string;
  filesTouched?: string[];
  toolCallsCount?: number;
  durationMs?: number;
  rawMetadata?: Record<string, unknown>;
}

export interface AdapterHealth {
  status: "healthy" | "degraded" | "unavailable";
  message: string;
  lastChecked: number;
  details?: Record<string, unknown>;
}
