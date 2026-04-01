import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

function getKiroDataDir(): string {
  const platform = os.platform();
  if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "kiro",
      "User",
      "globalStorage",
      "kiro.kiroagent"
    );
  }
  // Linux: try ~/.config/kiro first
  const configDir = path.join(os.homedir(), ".config", "kiro");
  if (fs.existsSync(configDir)) return configDir;
  return path.join(os.homedir(), ".kiro");
}

const KIRO_DATA_DIR = getKiroDataDir();

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

async function findSessionDirs(basePath: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await fs.promises.readdir(basePath);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const full = path.join(basePath, entry);
    try {
      const stat = await fs.promises.stat(full);
      if (stat.isDirectory()) {
        results.push(full);
      }
    } catch {
      continue;
    }
  }

  return results;
}

async function findJsonFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(d: string) {
    let entries: string[];
    try {
      entries = await fs.promises.readdir(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(d, entry);
      try {
        const stat = await fs.promises.stat(full);
        if (stat.isDirectory()) {
          await walk(full);
        } else if (entry.endsWith(".json")) {
          results.push(full);
        }
      } catch {
        continue;
      }
    }
  }

  await walk(dir);
  return results;
}

async function parseSessionFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let raw: string;
  try {
    raw = await fs.promises.readFile(filePath, "utf-8");
  } catch {
    return results;
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return results;
  }

  const messages = (data.messages || data.conversation || []) as Record<string, unknown>[];
  if (!Array.isArray(messages)) return results;

  const sessionId = (data.sessionId as string) || (data.id as string) || path.basename(filePath, ".json");
  const projectName = (data.projectName as string) || (data.workspace as string) || "Kiro Session";
  const projectPath = (data.workspacePath as string) || (data.cwd as string) || undefined;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user" && msg.type !== "user") continue;

    const promptText = extractTextFromContent(msg.content || msg.text || msg.message);
    if (!promptText.trim()) continue;

    // Find next assistant message
    let responsePreview: string | undefined;
    let model: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      const next = messages[j];
      if (next.role === "assistant" || next.type === "assistant") {
        const responseText = extractTextFromContent(next.content || next.text || next.message);
        responsePreview = responseText ? responseText.slice(0, 200) : undefined;
        model = (next.model as string) || undefined;
        break;
      }
      if (next.role === "user" || next.type === "user") break;
    }

    const timestamp = msg.timestamp
      ? typeof msg.timestamp === "number"
        ? msg.timestamp
        : new Date(msg.timestamp as string).getTime()
      : (data.createdAt
          ? new Date(data.createdAt as string).getTime()
          : Date.now());

    results.push({
      sessionId,
      projectName,
      projectPath,
      timestamp,
      promptText,
      responsePreview,
      model: model || "Kiro",
      rawMetadata: {
        sourceFile: filePath,
      },
    });
  }

  return results;
}

export const kiroAdapter: SourceAdapter = {
  id: "kiro",
  name: "Kiro",
  type: "kiro",
  description: "Imports prompt history from Kiro IDE session data.",

  getDefaultPath(): string {
    return KIRO_DATA_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(KIRO_DATA_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    const sessionDirs = await findSessionDirs(basePath);

    // Also check for JSON files directly in the base path
    const topLevelFiles = await findJsonFiles(basePath);
    for (const file of topLevelFiles) {
      try {
        const parsed = await parseSessionFile(file);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    for (const sessionDir of sessionDirs) {
      const files = await findJsonFiles(sessionDir);
      for (const file of files) {
        try {
          const parsed = await parseSessionFile(file);
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
      await fs.promises.access(KIRO_DATA_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Kiro data directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const sessionDirs = await findSessionDirs(KIRO_DATA_DIR);
      const files = await findJsonFiles(KIRO_DATA_DIR);
      return {
        status: "healthy",
        message: `Found ${sessionDirs.length} session dir(s), ${files.length} JSON file(s)`,
        lastChecked: Date.now(),
        details: { sessionDirCount: sessionDirs.length, jsonFileCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Kiro data directory",
        lastChecked: Date.now(),
      };
    }
  },
};
