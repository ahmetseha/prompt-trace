import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const PROJECTS_DIR = path.join(os.homedir(), ".cursor", "projects");

/**
 * Extract project name from a Cursor project directory name.
 * Directory names look like `Users-acar-www-project-name`.
 * Take the last segment after `www-` if present, otherwise last segment.
 */
function extractProjectName(dirName: string): string {
  const parts = dirName.replace(/^-+/, "").split("-");
  const wwwIdx = parts.lastIndexOf("www");
  if (wwwIdx !== -1 && wwwIdx < parts.length - 1) {
    return parts.slice(wwwIdx + 1).join("-");
  }
  return parts[parts.length - 1] || dirName;
}

/**
 * Strip <user_query>...</user_query> tags from user message text.
 */
function stripUserQueryTags(text: string): string {
  return text
    .replace(/<user_query>\s*/g, "")
    .replace(/\s*<\/user_query>/g, "")
    .trim();
}

/**
 * Extract text content from a message content array.
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (block: Record<string, unknown>) =>
        (block.type === "text" || !block.type) && typeof block.text === "string"
    )
    .map((block: Record<string, unknown>) => block.text as string)
    .join("\n");
}

/**
 * Parse a single Cursor JSONL file.
 */
async function parseJsonlFile(
  filePath: string,
  projectDirName: string,
  fileBirthtime: number,
  fileMtime: number
): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const messages: Record<string, unknown>[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      messages.push(JSON.parse(trimmed));
    } catch {
      // Skip malformed lines
    }
  }

  const projectName = extractProjectName(projectDirName);
  const sessionId = path.basename(path.dirname(filePath));

  // Count user messages first to distribute timestamps across session duration
  const userMsgIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") userMsgIndices.push(i);
  }
  const totalUsers = userMsgIndices.length;

  let userIndex = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    const content = msg.message
      ? (msg.message as Record<string, unknown>).content
      : msg.content;
    let promptText = extractTextFromContent(content);
    if (!promptText.trim()) { userIndex++; continue; }
    promptText = stripUserQueryTags(promptText);
    if (!promptText.trim()) { userIndex++; continue; }

    // Find next assistant message
    let assistantMsg: Record<string, unknown> | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === "assistant") {
        assistantMsg = messages[j];
        break;
      }
      if (messages[j].role === "user") break;
    }

    const assistantContent = assistantMsg?.message
      ? (assistantMsg.message as Record<string, unknown>).content
      : assistantMsg?.content;
    const responseText = assistantContent
      ? extractTextFromContent(assistantContent)
      : undefined;
    const responsePreview = responseText ? responseText.slice(0, 200) : undefined;

    // Distribute timestamps proportionally between file birth and mtime
    const sessionStart = fileBirthtime;
    const sessionEnd = fileMtime;
    const duration = Math.max(sessionEnd - sessionStart, 60_000); // at least 1 min
    const promptTimestamp = totalUsers <= 1
      ? sessionEnd
      : sessionStart + Math.round((userIndex / (totalUsers - 1)) * duration);

    results.push({
      sessionId,
      projectName,
      timestamp: promptTimestamp,
      promptText,
      responsePreview,
      model: "Cursor",
      rawMetadata: {
        sourceFile: filePath,
      },
    });

    userIndex++;
  }

  return results;
}

/**
 * Recursively find all JSONL files under agent-transcripts directories.
 */
async function findJsonlFiles(basePath: string): Promise<{ filePath: string; projectDir: string }[]> {
  const results: { filePath: string; projectDir: string }[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await fs.promises.readdir(basePath);
  } catch {
    return results;
  }

  for (const projectDir of projectDirs) {
    const transcriptsDir = path.join(basePath, projectDir, "agent-transcripts");
    let sessionDirs: string[];
    try {
      sessionDirs = await fs.promises.readdir(transcriptsDir);
    } catch {
      continue;
    }

    for (const sessionDir of sessionDirs) {
      const sessionPath = path.join(transcriptsDir, sessionDir);
      let files: string[];
      try {
        const stat = await fs.promises.stat(sessionPath);
        if (!stat.isDirectory()) continue;
        files = await fs.promises.readdir(sessionPath);
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.endsWith(".jsonl")) continue;
        results.push({
          filePath: path.join(sessionPath, file),
          projectDir,
        });
      }
    }
  }

  return results;
}

/**
 * Count total JSONL files for health check.
 */
async function countJsonlFiles(basePath: string): Promise<number> {
  const files = await findJsonlFiles(basePath);
  return files.length;
}

export const cursorAdapter: SourceAdapter = {
  id: "cursor",
  name: "Cursor",
  type: "cursor",
  description:
    "Imports prompt history from Cursor editor's agent transcript logs.",

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
    const jsonlFiles = await findJsonlFiles(basePath);

    for (const { filePath, projectDir } of jsonlFiles) {
      try {
        const stat = await fs.promises.stat(filePath);
        const birthtime = stat.birthtimeMs;
        const mtime = stat.mtimeMs;
        const parsed = await parseJsonlFile(filePath, projectDir, birthtime, mtime);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
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
        message: "Cursor projects directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const count = await countJsonlFiles(PROJECTS_DIR);
      return {
        status: "healthy",
        message: `Found ${count} JSONL transcript file(s)`,
        lastChecked: Date.now(),
        details: { jsonlCount: count },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Cursor projects directory",
        lastChecked: Date.now(),
      };
    }
  },
};
