import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Resolve the Zed conversations directory based on platform.
 */
function getConversationsDir(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Zed",
        "conversations"
      );
    case "linux":
      return path.join(os.homedir(), ".config", "zed", "conversations");
    default:
      return path.join(os.homedir(), ".config", "zed", "conversations");
  }
}

/**
 * Resolve the Zed database directory (for SQLite with zstd-compressed blobs).
 */
function getDbDir(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Zed",
        "db"
      );
    case "linux":
      return path.join(os.homedir(), ".config", "zed", "db");
    default:
      return path.join(os.homedir(), ".config", "zed", "db");
  }
}

const CONVERSATIONS_DIR = getConversationsDir();
const DB_DIR = getDbDir();

/**
 * Extract text from Zed message content.
 */
function extractText(content: unknown): string {
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
 * Parse a single Zed conversation JSON file.
 */
function parseConversationFile(
  raw: string,
  filePath: string
): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return results;
  }

  const conversationId =
    (data.id as string) ||
    path.basename(filePath, ".json");

  const title = (data.title as string) || undefined;

  const messages =
    (data.messages as Record<string, unknown>[]) ||
    (data.exchanges as Record<string, unknown>[]) ||
    [];

  if (!Array.isArray(messages)) return results;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    const role = (msg.role as string) || (msg.type as string);
    if (role !== "user" && role !== "human") continue;

    // Extract the user prompt text
    const promptText = extractText(msg.content || msg.body || msg.text || msg.message);
    if (!promptText.trim()) continue;

    // Find next assistant message
    let responsePreview: string | undefined;
    let model: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      const r = messages[j];
      const rRole = (r.role as string) || (r.type as string);
      if (rRole === "assistant" || rRole === "ai") {
        const respText = extractText(r.content || r.body || r.text || r.message);
        responsePreview = respText ? respText.slice(0, 200) : undefined;
        model = (r.model as string) || undefined;
        break;
      }
      if (rRole === "user" || rRole === "human") break;
    }

    const timestamp =
      (msg.timestamp as number) ||
      (typeof msg.timestamp === "string"
        ? new Date(msg.timestamp as string).getTime()
        : 0) ||
      (data.updated_at
        ? new Date(data.updated_at as string).getTime()
        : 0) ||
      (data.created_at
        ? new Date(data.created_at as string).getTime()
        : 0) ||
      Date.now();

    results.push({
      externalId: (msg.id as string) || undefined,
      sessionId: conversationId,
      projectName: title || "Zed Conversation",
      timestamp,
      promptText,
      responsePreview,
      model: model || (data.model as string) || "Zed Assistant",
      rawMetadata: {
        source: "zed-conversation-json",
        title,
        sourceFile: filePath,
      },
    });
  }

  return results;
}

/**
 * Try to parse Zed SQLite databases for conversations with zstd-compressed blobs.
 */
async function parseDbConversations(dbDir: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let Database: unknown;
  try {
    Database = require("better-sqlite3");
  } catch {
    return results;
  }

  let files: string[];
  try {
    files = await fs.promises.readdir(dbDir);
  } catch {
    return results;
  }

  for (const file of files) {
    if (!file.endsWith(".db") && !file.endsWith(".sqlite")) continue;
    const dbPath = path.join(dbDir, file);

    try {
      const db = new (Database as new (...args: unknown[]) => Record<string, (...args: unknown[]) => unknown>)(dbPath, {
        readonly: true,
      });

      // Try to find conversation tables - Zed may use various schemas
      let rows: { id?: string; title?: string; body?: string; messages?: string; created_at?: string; updated_at?: string }[] = [];

      try {
        // First check what tables exist
        const tables = (
          db.prepare as (sql: string) => { all: () => { name: string }[] }
        )(
          "SELECT name FROM sqlite_master WHERE type='table'"
        ).all();

        const tableNames = tables.map((t) => t.name);

        // Look for conversation-like tables
        for (const tableName of tableNames) {
          if (
            tableName.includes("conversation") ||
            tableName.includes("message") ||
            tableName.includes("chat")
          ) {
            try {
              rows = (
                db.prepare as (sql: string) => { all: () => typeof rows }
              )(
                `SELECT * FROM "${tableName}" LIMIT 1000`
              ).all();

              for (const row of rows) {
                // If row has a body field with JSON, try to parse it
                const body = row.body || row.messages;
                if (body && typeof body === "string") {
                  try {
                    const parsed = parseConversationFile(body, `${dbPath}:${tableName}`);
                    results.push(...parsed);
                  } catch {
                    // Body may be zstd compressed - we can't decompress without native bindings
                    // Skip for now
                  }
                }

                // If the row itself looks like a message
                if (row.title && typeof row.title === "string") {
                  const timestamp = row.created_at
                    ? new Date(row.created_at).getTime()
                    : row.updated_at
                      ? new Date(row.updated_at).getTime()
                      : Date.now();

                  // This is likely a conversation summary, not a prompt
                  // We'd need the actual messages, which may be zstd compressed
                }
              }
            } catch {
              // Table schema mismatch
            }
          }
        }
      } catch {
        // Query failed
      }

      (db.close as () => void)();
    } catch {
      // Skip corrupt databases
    }
  }

  return results;
}

export const zedAdapter: SourceAdapter = {
  id: "zed",
  name: "Zed",
  type: "zed" as SourceAdapter["type"],
  description:
    "Imports prompt history from Zed editor conversation logs and databases.",

  getDefaultPath(): string {
    return CONVERSATIONS_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(CONVERSATIONS_DIR);
      return true;
    } catch {
      // Also check the db dir
      try {
        await fs.promises.access(DB_DIR);
        return true;
      } catch {
        return false;
      }
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    // 1. Parse JSON conversation files
    let files: string[];
    try {
      files = await fs.promises.readdir(basePath);
    } catch {
      files = [];
    }

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(basePath, file);

      try {
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) continue;

        const raw = await fs.promises.readFile(filePath, "utf-8");
        const parsed = parseConversationFile(raw, filePath);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    // 2. Try SQLite databases in the db directory
    const dbResults = await parseDbConversations(DB_DIR);
    results.push(...dbResults);

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    let conversationsExist = false;
    let dbExists = false;

    try {
      await fs.promises.access(CONVERSATIONS_DIR);
      conversationsExist = true;
    } catch {
      // Not available
    }

    try {
      await fs.promises.access(DB_DIR);
      dbExists = true;
    } catch {
      // Not available
    }

    if (!conversationsExist && !dbExists) {
      return {
        status: "unavailable",
        message: "Zed data directories not found",
        lastChecked: Date.now(),
      };
    }

    let jsonCount = 0;
    let dbFileCount = 0;

    try {
      if (conversationsExist) {
        const files = await fs.promises.readdir(CONVERSATIONS_DIR);
        jsonCount = files.filter((f) => f.endsWith(".json")).length;
      }

      if (dbExists) {
        const files = await fs.promises.readdir(DB_DIR);
        dbFileCount = files.filter(
          (f) => f.endsWith(".db") || f.endsWith(".sqlite")
        ).length;
      }
    } catch {
      return {
        status: "degraded",
        message: "Could not fully read Zed data directories",
        lastChecked: Date.now(),
      };
    }

    return {
      status: "healthy",
      message: `Found ${jsonCount} conversation file(s), ${dbFileCount} database(s)`,
      lastChecked: Date.now(),
      details: { jsonCount, dbFileCount },
    };
  },
};
