import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

function getAntigravityDir(): string {
  const platform = os.platform();
  if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Antigravity",
      "User",
      "workspaceStorage"
    );
  }
  if (platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "Antigravity",
      "User",
      "workspaceStorage"
    );
  }
  // Linux
  return path.join(os.homedir(), ".config", "Antigravity", "User", "workspaceStorage");
}

const ANTIGRAVITY_WORKSPACE_DIR = getAntigravityDir();

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

/** Chat-related keys commonly stored in VS Code fork state databases. */
const CHAT_KEYS = [
  "aiService.generations",
  "aiService.chatHistory",
  "chat.history",
  "antigravity.chatHistory",
  "antigravity.conversations",
  "workbench.panel.chat",
];

async function findVscdbFiles(basePath: string): Promise<string[]> {
  const results: string[] = [];
  let workspaces: string[];
  try {
    workspaces = await fs.promises.readdir(basePath);
  } catch {
    return results;
  }

  for (const ws of workspaces) {
    const dbPath = path.join(basePath, ws, "state.vscdb");
    try {
      await fs.promises.access(dbPath);
      results.push(dbPath);
    } catch {
      continue;
    }
  }

  return results;
}

async function parseVscdb(dbPath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let Database;
  try {
    Database = require("better-sqlite3");
  } catch {
    return results;
  }

  try {
    const db = new Database(dbPath, { readonly: true });

    // Check which tables exist
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    if (!tableNames.includes("ItemTable")) {
      db.close();
      return results;
    }

    // Try each known chat key
    for (const chatKey of CHAT_KEYS) {
      try {
        const row = db
          .prepare("SELECT value FROM ItemTable WHERE key = ?")
          .get(chatKey) as { value: string } | undefined;

        if (!row?.value) continue;

        let data: unknown;
        try {
          data = JSON.parse(row.value);
        } catch {
          continue;
        }

        // Handle array of conversations/messages
        const conversations = Array.isArray(data)
          ? data
          : (data as Record<string, unknown>).conversations ||
            (data as Record<string, unknown>).history ||
            (data as Record<string, unknown>).messages;

        if (!Array.isArray(conversations)) continue;

        // Could be flat messages or nested conversations
        for (const item of conversations) {
          const record = item as Record<string, unknown>;

          // If item has messages array, it's a conversation
          const messages = (record.messages || record.turns || [record]) as Record<string, unknown>[];
          if (!Array.isArray(messages)) continue;

          const sessionId =
            (record.id as string) ||
            (record.conversationId as string) ||
            path.basename(path.dirname(dbPath));

          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.role !== "user" && msg.type !== "user") continue;

            const promptText = extractTextFromContent(
              msg.content || msg.text || msg.message
            );
            if (!promptText.trim()) continue;

            // Find next assistant response
            let responsePreview: string | undefined;
            let model: string | undefined;
            for (let j = i + 1; j < messages.length; j++) {
              const next = messages[j];
              if (next.role === "assistant" || next.type === "assistant") {
                const text = extractTextFromContent(
                  next.content || next.text || next.message
                );
                responsePreview = text ? text.slice(0, 200) : undefined;
                model = (next.model as string) || undefined;
                break;
              }
              if (next.role === "user" || next.type === "user") break;
            }

            const tsRaw = msg.timestamp || msg.createdAt || msg.unixMs || record.timestamp;
            let timestamp: number;
            if (typeof tsRaw === "number") {
              // If value looks like seconds rather than ms, convert
              timestamp = tsRaw < 1e12 ? tsRaw * 1000 : tsRaw;
            } else if (typeof tsRaw === "string") {
              timestamp = new Date(tsRaw).getTime();
            } else {
              timestamp = Date.now();
            }

            results.push({
              sessionId,
              projectName: "Antigravity Session",
              timestamp,
              promptText,
              responsePreview,
              model: model || "Antigravity",
              rawMetadata: {
                sourceFile: dbPath,
                chatKey,
              },
            });
          }
        }
      } catch {
        // Skip this key
      }
    }

    db.close();
  } catch {
    // Skip corrupt databases
  }

  return results;
}

export const antigravityAdapter: SourceAdapter = {
  id: "antigravity",
  name: "Antigravity",
  type: "antigravity",
  description:
    "Imports prompt history from Antigravity editor's workspace state databases.",

  getDefaultPath(): string {
    return ANTIGRAVITY_WORKSPACE_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(ANTIGRAVITY_WORKSPACE_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];
    const dbFiles = await findVscdbFiles(basePath);

    for (const dbFile of dbFiles) {
      try {
        const parsed = await parseVscdb(dbFile);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(ANTIGRAVITY_WORKSPACE_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Antigravity workspace directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const dbFiles = await findVscdbFiles(ANTIGRAVITY_WORKSPACE_DIR);
      return {
        status: "healthy",
        message: `Found ${dbFiles.length} workspace database(s)`,
        lastChecked: Date.now(),
        details: { databaseCount: dbFiles.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Antigravity workspace directory",
        lastChecked: Date.now(),
      };
    }
  },
};
