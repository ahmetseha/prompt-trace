import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const CURSOR_PROJECTS_DIR = path.join(os.homedir(), ".cursor", "projects");
const CURSOR_WORKSPACE_DIR = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "Cursor",
  "User",
  "workspaceStorage"
);

function extractProjectName(dirName: string): string {
  const parts = dirName.replace(/^-+/, "").split("-");
  const wwwIdx = parts.lastIndexOf("www");
  if (wwwIdx !== -1 && wwwIdx < parts.length - 1) {
    return parts.slice(wwwIdx + 1).join("-");
  }
  return parts[parts.length - 1] || dirName;
}

function stripUserQueryTags(text: string): string {
  return text
    .replace(/<user_query>\s*/g, "")
    .replace(/\s*<\/user_query>/g, "")
    .trim();
}

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
 * Build a timestamp lookup from Cursor's workspace SQLite databases.
 * Key: first 60 chars of prompt text -> timestamp in ms
 */
async function loadTimestampMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  try {
    let Database;
    try {
      Database = require("better-sqlite3");
    } catch {
      return map;
    }

    const wsDir = CURSOR_WORKSPACE_DIR;
    if (!fs.existsSync(wsDir)) return map;

    const workspaces = await fs.promises.readdir(wsDir);
    for (const ws of workspaces) {
      const dbPath = path.join(wsDir, ws, "state.vscdb");
      if (!fs.existsSync(dbPath)) continue;

      try {
        const db = new Database(dbPath, { readonly: true });
        const row = db
          .prepare("SELECT value FROM ItemTable WHERE key = 'aiService.generations'")
          .get() as { value: string } | undefined;
        db.close();

        if (!row?.value) continue;

        const records = JSON.parse(row.value);
        if (!Array.isArray(records)) continue;

        for (const r of records) {
          const ts = r.unixMs as number;
          const text = (r.textDescription as string) || "";
          if (ts && text) {
            // Use first 60 chars as key for matching
            const key = text.trim().slice(0, 60).toLowerCase();
            map.set(key, ts);
          }
        }
      } catch {
        // Skip corrupt databases
      }
    }
  } catch {
    // Workspace dir not accessible
  }

  return map;
}

async function parseJsonlFile(
  filePath: string,
  projectDirName: string,
  fileBirthtime: number,
  fileMtime: number,
  timestampMap: Map<string, number>
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
      // skip
    }
  }

  const projectName = extractProjectName(projectDirName);
  const sessionId = path.basename(path.dirname(filePath));

  // Count user messages for fallback timestamp distribution
  let userCount = 0;
  for (const msg of messages) {
    if (msg.role === "user") userCount++;
  }

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

    // Try to find real timestamp from workspace DB
    const lookupKey = promptText.trim().slice(0, 60).toLowerCase();
    let timestamp = timestampMap.get(lookupKey);

    // For the LAST user message: use file mtime (most accurate for recent prompts)
    // because aiService.generations may not have synced yet
    const isLastUser = userIndex === userCount - 1;
    if (isLastUser) {
      // mtime updates immediately when new message is written to JSONL
      timestamp = fileMtime;
    }

    // Fallback: distribute between birthtime and mtime
    if (!timestamp) {
      const duration = Math.max(fileMtime - fileBirthtime, 60_000);
      timestamp = userCount <= 1
        ? fileMtime
        : fileBirthtime + Math.round((userIndex / (userCount - 1)) * duration);
    }

    results.push({
      sessionId,
      projectName,
      timestamp,
      promptText,
      responsePreview,
      model: "Cursor",
      rawMetadata: {
        sourceFile: filePath,
        hasRealTimestamp: timestampMap.has(lookupKey),
      },
    });

    userIndex++;
  }

  return results;
}

async function findJsonlFiles(
  basePath: string
): Promise<{ filePath: string; projectDir: string }[]> {
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

export const cursorAdapter: SourceAdapter = {
  id: "cursor",
  name: "Cursor",
  type: "cursor",
  description:
    "Imports prompt history from Cursor editor's agent transcript logs with real timestamps.",

  getDefaultPath(): string {
    return CURSOR_PROJECTS_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(CURSOR_PROJECTS_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];
    const jsonlFiles = await findJsonlFiles(basePath);

    // Load real timestamps from workspace SQLite
    const timestampMap = await loadTimestampMap();

    for (const { filePath, projectDir } of jsonlFiles) {
      try {
        const stat = await fs.promises.stat(filePath);
        const parsed = await parseJsonlFile(
          filePath,
          projectDir,
          stat.birthtimeMs,
          stat.mtimeMs,
          timestampMap
        );
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(CURSOR_PROJECTS_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Cursor projects directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const files = await findJsonlFiles(CURSOR_PROJECTS_DIR);
      const timestampMap = await loadTimestampMap();
      return {
        status: "healthy",
        message: `Found ${files.length} transcript(s), ${timestampMap.size} timestamped prompts`,
        lastChecked: Date.now(),
        details: { jsonlCount: files.length, timestampedPrompts: timestampMap.size },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Cursor projects",
        lastChecked: Date.now(),
      };
    }
  },
};
