import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");

/** Tool names that reference file paths. */
const FILE_TOOLS = new Set(["Edit", "Write", "Read", "Glob", "Grep"]);

/**
 * Extract the project name from a Claude Code project directory name.
 * Directory names look like `-Users-acar-www-project-name`.
 * We take the last meaningful segment (after `www-` if present, otherwise last segment).
 */
function extractProjectName(dirName: string): string {
  const parts = dirName.replace(/^-+/, "").split("-");
  // Find the index after "www" if present
  const wwwIdx = parts.lastIndexOf("www");
  if (wwwIdx !== -1 && wwwIdx < parts.length - 1) {
    return parts.slice(wwwIdx + 1).join("-");
  }
  // Fallback: last segment
  return parts[parts.length - 1] || dirName;
}

/**
 * Extract text content from a message content array.
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block: Record<string, unknown>) => block.type === "text" && typeof block.text === "string")
    .map((block: Record<string, unknown>) => block.text as string)
    .join("\n");
}

/**
 * Count tool_use blocks in content array.
 */
function countToolUse(content: unknown): number {
  if (!Array.isArray(content)) return 0;
  return content.filter((block: Record<string, unknown>) => block.type === "tool_use").length;
}

/**
 * Extract file paths from tool_use blocks.
 */
function extractFilePaths(content: unknown): { filePath: string; action: string }[] {
  if (!Array.isArray(content)) return [];
  const results: { filePath: string; action: string }[] = [];
  for (const block of content) {
    if (
      block.type === "tool_use" &&
      typeof block.name === "string" &&
      FILE_TOOLS.has(block.name) &&
      block.input &&
      typeof (block.input as Record<string, unknown>).file_path === "string"
    ) {
      results.push({
        filePath: (block.input as Record<string, unknown>).file_path as string,
        action: block.name.toLowerCase(),
      });
    }
  }
  return results;
}

/**
 * Calculate total tokens from a usage object.
 */
function totalTokensFromUsage(usage: Record<string, unknown> | undefined): number {
  if (!usage) return 0;
  const input = (usage.input_tokens as number) || 0;
  const output = (usage.output_tokens as number) || 0;
  const cacheRead = (usage.cache_read_input_tokens as number) || 0;
  const cacheCreation = (usage.cache_creation_input_tokens as number) || 0;
  return input + output + cacheRead + cacheCreation;
}

/**
 * Parse a single JSONL file and return parsed prompts.
 */
async function parseJsonlFile(
  filePath: string,
  projectDirName: string
): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  // Collect all messages first
  const messages: Record<string, unknown>[] = [];
  const sessionTitles = new Map<string, string>();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj.type === "ai-title" && obj.aiTitle) {
        sessionTitles.set(obj.sessionId, obj.aiTitle);
      }
      messages.push(obj);
    } catch {
      // Skip malformed lines
    }
  }

  const projectName = extractProjectName(projectDirName);

  // Pair user messages with their next assistant response
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.type !== "user") continue;

    const content = msg.message
      ? (msg.message as Record<string, unknown>).content
      : undefined;
    const promptText = extractTextFromContent(content);
    if (!promptText.trim()) continue;

    // Find next assistant message
    let assistantMsg: Record<string, unknown> | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].type === "assistant") {
        assistantMsg = messages[j];
        break;
      }
      if (messages[j].type === "user") break; // No assistant response found before next user
    }

    const assistantContent = assistantMsg?.message
      ? (assistantMsg.message as Record<string, unknown>).content
      : undefined;
    const responseText = assistantContent ? extractTextFromContent(assistantContent) : undefined;
    const responsePreview = responseText ? responseText.slice(0, 200) : undefined;

    const assistantMessage = assistantMsg?.message as Record<string, unknown> | undefined;
    const model = assistantMessage?.model as string | undefined;
    const usage = assistantMessage?.usage as Record<string, unknown> | undefined;

    const toolCallsCount = assistantContent ? countToolUse(assistantContent) : 0;
    const fileEntries = assistantContent ? extractFilePaths(assistantContent) : [];
    const filesTouched = fileEntries.map((f) => f.filePath);

    const timestamp = msg.timestamp
      ? new Date(msg.timestamp as string).getTime()
      : Date.now();

    const sessionId = (msg.sessionId as string) || path.basename(filePath, ".jsonl");
    const projectPath = (msg.cwd as string) || undefined;

    const totalTokens = totalTokensFromUsage(usage);

    const parsed: ParsedPrompt = {
      externalId: (msg.uuid as string) || undefined,
      sessionId,
      projectName,
      projectPath,
      timestamp,
      promptText,
      responsePreview,
      model,
      filesTouched: filesTouched.length > 0 ? filesTouched : undefined,
      toolCallsCount: toolCallsCount > 0 ? toolCallsCount : undefined,
      rawMetadata: {
        usage,
        totalTokens,
        gitBranch: msg.gitBranch,
        sessionTitle: sessionTitles.get(sessionId),
        fileActions: fileEntries.length > 0 ? fileEntries : undefined,
      },
    };

    results.push(parsed);
  }

  return results;
}

export const claudeCodeAdapter: SourceAdapter = {
  id: "claude-code",
  name: "Claude Code",
  type: "claude-code",
  description:
    "Imports prompt history from Claude Code CLI conversation logs.",

  getDefaultPath(): string {
    return PROJECTS_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(PROJECTS_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    let projectDirs: string[];
    try {
      projectDirs = await fs.promises.readdir(basePath);
    } catch {
      return results;
    }

    for (const projectDir of projectDirs) {
      const projectDirPath = path.join(basePath, projectDir);

      let stat: fs.Stats;
      try {
        stat = await fs.promises.stat(projectDirPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;

      let files: string[];
      try {
        files = await fs.promises.readdir(projectDirPath);
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.endsWith(".jsonl")) continue;
        const filePath = path.join(projectDirPath, file);

        try {
          const parsed = await parseJsonlFile(filePath, projectDir);
          results.push(...parsed);
        } catch {
          // Skip corrupt files
        }
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(PROJECTS_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Claude Code projects directory not found",
        lastChecked: Date.now(),
      };
    }

    let jsonlCount = 0;
    try {
      const projectDirs = await fs.promises.readdir(PROJECTS_DIR);
      for (const dir of projectDirs) {
        const dirPath = path.join(PROJECTS_DIR, dir);
        try {
          const stat = await fs.promises.stat(dirPath);
          if (!stat.isDirectory()) continue;
          const files = await fs.promises.readdir(dirPath);
          jsonlCount += files.filter((f) => f.endsWith(".jsonl")).length;
        } catch {
          // skip
        }
      }
    } catch {
      return {
        status: "degraded",
        message: "Could not read Claude Code projects directory",
        lastChecked: Date.now(),
      };
    }

    return {
      status: "healthy",
      message: `Found ${jsonlCount} JSONL session file(s)`,
      lastChecked: Date.now(),
      details: { jsonlCount },
    };
  },
};
