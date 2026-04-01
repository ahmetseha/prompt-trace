import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

function getOpenCodeDir(): string {
  const primary = path.join(os.homedir(), ".opencode");
  if (fs.existsSync(primary)) return primary;
  return path.join(os.homedir(), ".config", "opencode");
}

const OPENCODE_DIR = getOpenCodeDir();

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

async function findSessionFiles(basePath: string): Promise<string[]> {
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
        } else if (entry.endsWith(".json") || entry.endsWith(".jsonl")) {
          results.push(full);
        }
      } catch {
        continue;
      }
    }
  }

  await walk(basePath);
  return results;
}

async function parseSqliteDb(dbPath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let Database;
  try {
    Database = require("better-sqlite3");
  } catch {
    return results;
  }

  try {
    const db = new Database(dbPath, { readonly: true });

    // Try common table patterns for session/message storage
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    // Look for messages or conversations tables
    const messageTable = tableNames.find(
      (t) =>
        t.includes("message") ||
        t.includes("conversation") ||
        t.includes("chat") ||
        t.includes("session")
    );

    if (messageTable) {
      const columns = db
        .prepare(`PRAGMA table_info('${messageTable}')`)
        .all() as { name: string }[];
      const colNames = columns.map((c) => c.name);

      const hasRole = colNames.includes("role");
      const hasContent = colNames.includes("content");
      const hasText = colNames.includes("text");
      const hasTimestamp =
        colNames.includes("timestamp") || colNames.includes("created_at");

      if (hasRole && (hasContent || hasText)) {
        const contentCol = hasContent ? "content" : "text";
        const tsCol = colNames.includes("timestamp")
          ? "timestamp"
          : colNames.includes("created_at")
            ? "created_at"
            : null;
        const sessionCol = colNames.includes("session_id")
          ? "session_id"
          : colNames.includes("conversation_id")
            ? "conversation_id"
            : null;

        const selectCols = [
          "role",
          contentCol,
          ...(tsCol ? [tsCol] : []),
          ...(sessionCol ? [sessionCol] : []),
        ].join(", ");

        const rows = db
          .prepare(`SELECT ${selectCols} FROM '${messageTable}' ORDER BY rowid`)
          .all() as Record<string, unknown>[];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.role !== "user") continue;

          const promptText = extractTextFromContent(
            row[contentCol] as unknown
          );
          if (!promptText.trim()) continue;

          // Find next assistant row
          let responsePreview: string | undefined;
          let model: string | undefined;
          for (let j = i + 1; j < rows.length; j++) {
            if (rows[j].role === "assistant") {
              const text = extractTextFromContent(
                rows[j][contentCol] as unknown
              );
              responsePreview = text ? text.slice(0, 200) : undefined;
              model = (rows[j].model as string) || undefined;
              break;
            }
            if (rows[j].role === "user") break;
          }

          const tsRaw = tsCol ? row[tsCol] : null;
          const timestamp = tsRaw
            ? typeof tsRaw === "number"
              ? tsRaw
              : new Date(tsRaw as string).getTime()
            : Date.now();

          const sessionId = sessionCol
            ? (row[sessionCol] as string) || path.basename(dbPath, ".db")
            : path.basename(dbPath, ".db");

          results.push({
            sessionId,
            projectName: "OpenCode Session",
            timestamp,
            promptText,
            responsePreview,
            model: model || "OpenCode",
            rawMetadata: {
              sourceFile: dbPath,
              table: messageTable,
            },
          });
        }
      }
    }

    db.close();
  } catch {
    // Skip corrupt databases
  }

  return results;
}

async function parseJsonSessionFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let raw: string;
  try {
    raw = await fs.promises.readFile(filePath, "utf-8");
  } catch {
    return results;
  }

  // Handle JSONL files
  if (filePath.endsWith(".jsonl")) {
    const lines = raw.split("\n").filter((l) => l.trim());
    const messages: Record<string, unknown>[] = [];
    for (const line of lines) {
      try {
        messages.push(JSON.parse(line));
      } catch {
        continue;
      }
    }
    return parseMessages(messages, filePath);
  }

  // Handle JSON files
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return results;
  }

  if (Array.isArray(data)) {
    return parseMessages(data as Record<string, unknown>[], filePath);
  }

  const obj = data as Record<string, unknown>;
  const messages = (obj.messages || obj.conversation || obj.history || []) as Record<string, unknown>[];
  if (Array.isArray(messages)) {
    return parseMessages(messages, filePath, obj);
  }

  return results;
}

function parseMessages(
  messages: Record<string, unknown>[],
  filePath: string,
  metadata?: Record<string, unknown>
): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];
  const sessionId =
    (metadata?.sessionId as string) ||
    (metadata?.id as string) ||
    path.basename(filePath, path.extname(filePath));
  const projectName =
    (metadata?.projectName as string) ||
    (metadata?.cwd ? path.basename(metadata.cwd as string) : "OpenCode Session");
  const projectPath = (metadata?.cwd as string) || undefined;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user" && msg.type !== "user") continue;

    const promptText = extractTextFromContent(msg.content || msg.text || msg.message);
    if (!promptText.trim()) continue;

    let responsePreview: string | undefined;
    let model: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      const next = messages[j];
      if (next.role === "assistant" || next.type === "assistant") {
        const text = extractTextFromContent(next.content || next.text || next.message);
        responsePreview = text ? text.slice(0, 200) : undefined;
        model = (next.model as string) || undefined;
        break;
      }
      if (next.role === "user" || next.type === "user") break;
    }

    const timestamp = msg.timestamp
      ? typeof msg.timestamp === "number"
        ? msg.timestamp
        : new Date(msg.timestamp as string).getTime()
      : Date.now();

    results.push({
      sessionId,
      projectName,
      projectPath,
      timestamp,
      promptText,
      responsePreview,
      model: model || "OpenCode",
      rawMetadata: {
        sourceFile: filePath,
      },
    });
  }

  return results;
}

export const opencodeAdapter: SourceAdapter = {
  id: "opencode",
  name: "OpenCode",
  type: "opencode",
  description: "Imports prompt history from OpenCode session storage.",

  getDefaultPath(): string {
    return OPENCODE_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(OPENCODE_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    // Try SQLite databases first
    const dbFiles: string[] = [];
    async function findDbs(d: string) {
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
            await findDbs(full);
          } else if (entry.endsWith(".db") || entry.endsWith(".sqlite") || entry.endsWith(".sqlite3")) {
            dbFiles.push(full);
          }
        } catch {
          continue;
        }
      }
    }

    await findDbs(basePath);
    for (const dbFile of dbFiles) {
      try {
        const parsed = await parseSqliteDb(dbFile);
        results.push(...parsed);
      } catch {
        // Skip corrupt databases
      }
    }

    // Also parse JSON/JSONL session files
    const sessionFiles = await findSessionFiles(basePath);
    for (const file of sessionFiles) {
      try {
        const parsed = await parseJsonSessionFile(file);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(OPENCODE_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "OpenCode directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const files = await findSessionFiles(OPENCODE_DIR);
      return {
        status: "healthy",
        message: `Found ${files.length} session file(s)`,
        lastChecked: Date.now(),
        details: { sessionFileCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read OpenCode directory",
        lastChecked: Date.now(),
      };
    }
  },
};
