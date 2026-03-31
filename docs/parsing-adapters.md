# Parsing Adapters

PromptTrace uses a pluggable adapter system to ingest prompt history from different AI coding tools. Each adapter encapsulates all source-specific logic behind a uniform interface.

## SourceAdapter Interface

Every adapter implements the `SourceAdapter` interface defined in `src/lib/adapters/types.ts`:

```typescript
interface SourceAdapter {
  id: string;
  name: string;
  type: SourceType;
  description: string;
  detect: () => Promise<boolean>;
  getDefaultPath: () => string;
  parse: (basePath: string) => Promise<ParsedPrompt[]>;
  healthCheck: () => Promise<AdapterHealth>;
}
```

### Methods

**`detect()`** -- Returns `true` if the AI tool's data directory exists on the current machine. Used during source configuration to show which tools are available.

**`getDefaultPath()`** -- Returns the platform-specific filesystem path where the tool stores its history. Handles macOS, Windows, and Linux paths.

**`parse(basePath)`** -- Reads history files from the given path and returns an array of `ParsedPrompt` objects. This is where the bulk of source-specific logic lives.

**`healthCheck()`** -- Returns the adapter's current operational status: `healthy`, `degraded`, or `unavailable`. Includes a human-readable message and timestamp.

## ParsedPrompt Interface

The output of every adapter's `parse()` method is an array of `ParsedPrompt` objects:

```typescript
interface ParsedPrompt {
  externalId?: string;       // Original ID from the source tool
  sessionId?: string;        // Session grouping ID from the source
  projectName?: string;      // Detected project name
  projectPath?: string;      // Detected project filesystem path
  timestamp: number;         // Unix epoch timestamp (required)
  promptText: string;        // The prompt text (required)
  responsePreview?: string;  // Truncated AI response
  model?: string;            // Model identifier
  filesTouched?: string[];   // Files referenced or modified
  toolCallsCount?: number;   // Number of tool calls in the response
  durationMs?: number;       // Response duration in milliseconds
  rawMetadata?: Record<string, unknown>;  // Source-specific metadata
}
```

After parsing, the ingestion pipeline normalizes `ParsedPrompt` records into the database schema, runs classification, and computes scores.

## AdapterHealth Interface

```typescript
interface AdapterHealth {
  status: "healthy" | "degraded" | "unavailable";
  message: string;
  lastChecked: number;
  details?: Record<string, unknown>;
}
```

- **healthy** -- The tool's data directory is accessible and parseable.
- **degraded** -- The directory exists but there are issues (e.g., permission errors, unexpected format).
- **unavailable** -- The tool is not installed or the data directory does not exist.

## Adapter Registry

Adapters are registered in `src/lib/adapters/index.ts`:

```typescript
import { cursorAdapter } from "./cursor";
import { claudeCodeAdapter } from "./claude-code";

export const adapters: Record<string, SourceAdapter> = {
  cursor: cursorAdapter,
  "claude-code": claudeCodeAdapter,
};

export function getAdapter(type: string): SourceAdapter | undefined {
  return adapters[type];
}

export function getAllAdapters(): SourceAdapter[] {
  return Object.values(adapters);
}
```

## Current Adapters

### Cursor Adapter

**File:** `src/lib/adapters/cursor.ts`

**Status:** Placeholder implementation. Detection works; parsing returns an empty array.

**Data location by platform:**
- macOS: `~/Library/Application Support/Cursor/User/workspaceStorage`
- Windows: `%APPDATA%/Cursor/User/workspaceStorage`
- Linux: `~/.config/Cursor/User/workspaceStorage`

**How it will work:** Cursor stores AI conversation history in per-workspace SQLite databases within the workspace storage directory. The full implementation will enumerate workspace directories, open each SQLite database, and extract conversation records.

### Claude Code Adapter

**File:** `src/lib/adapters/claude-code.ts`

**Status:** Placeholder implementation. Detection works; parsing returns an empty array.

**Data location:** `~/.claude` (all platforms).

**How it will work:** Claude Code stores conversation logs as JSONL files under `~/.claude/projects/`. The full implementation will read these files, parse each JSON line as a conversation turn, and extract prompt/response pairs with associated metadata.

## How to Add a New Adapter

Follow these steps to add support for a new AI coding tool.

### 1. Create the adapter file

Create a new file in `src/lib/adapters/`, for example `copilot.ts`:

```typescript
import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

export const copilotAdapter: SourceAdapter = {
  id: "copilot",
  name: "GitHub Copilot",
  type: "copilot",
  description: "Imports prompt history from GitHub Copilot Chat.",

  getDefaultPath(): string {
    const home = os.homedir();
    // Replace with the actual path for Copilot's history storage
    switch (process.platform) {
      case "darwin":
        return path.join(home, "Library", "Application Support", "Code", "User", "workspaceStorage");
      case "win32":
        return path.join(home, "AppData", "Roaming", "Code", "User", "workspaceStorage");
      default:
        return path.join(home, ".config", "Code", "User", "workspaceStorage");
    }
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(this.getDefaultPath());
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    // Implement source-specific parsing logic here.
    // Read files from basePath, extract prompt data, return ParsedPrompt[].
    const results: ParsedPrompt[] = [];
    // ... parsing logic ...
    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    const exists = await this.detect();
    return {
      status: exists ? "healthy" : "unavailable",
      message: exists
        ? "Copilot data directory found"
        : "Copilot installation not detected",
      lastChecked: Date.now(),
    };
  },
};
```

### 2. Add the source type

Add the new source type to `SourceType` in `src/lib/types/index.ts`:

```typescript
export type SourceType =
  | 'cursor'
  | 'claude-code'
  | 'copilot'       // already present
  | 'gemini-cli'
  | 'codex-cli'
  | 'json-import'
  | 'markdown-import';
```

### 3. Register the adapter

Import and register the adapter in `src/lib/adapters/index.ts`:

```typescript
import { copilotAdapter } from "./copilot";

export const adapters: Record<string, SourceAdapter> = {
  cursor: cursorAdapter,
  "claude-code": claudeCodeAdapter,
  copilot: copilotAdapter,
};
```

### 4. Test

Run the health check to verify detection:

```typescript
const adapter = getAdapter("copilot");
const health = await adapter?.healthCheck();
console.log(health);
```

Then test parsing with a known data directory to ensure `ParsedPrompt` objects are correctly formed.

## Health Check System

The health check system provides operational status for all configured sources. It is used by:

- The **Sources page** (`/dashboard/sources`) to display connection status for each adapter.
- The **API route** (`/api/sources`) which returns health status alongside source configuration.

Health checks are lightweight -- they verify directory existence and basic accessibility without performing full parsing. They can be called frequently without performance concerns.
