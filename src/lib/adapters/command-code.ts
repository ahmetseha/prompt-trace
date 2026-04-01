import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

function getCommandCodeDir(): string {
  const primary = path.join(os.homedir(), ".commandcode");
  if (fs.existsSync(primary)) return primary;
  return path.join(os.homedir(), ".config", "commandcode");
}

const COMMANDCODE_DIR = getCommandCodeDir();

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

async function parseJsonlSessionFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const messages: Record<string, unknown>[] = [];
  let sessionMeta: Record<string, unknown> = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === "session_meta" || obj.type === "meta") {
        sessionMeta = obj.payload || obj;
      }
      messages.push(obj);
    } catch {
      continue;
    }
  }

  const sessionId =
    (sessionMeta.id as string) ||
    (sessionMeta.sessionId as string) ||
    path.basename(filePath, path.extname(filePath));
  const cwd = (sessionMeta.cwd as string) || "";
  const projectName = cwd ? path.basename(cwd) : "Command Code Session";

  // Extract user/assistant message pairs
  const userMessages: { timestamp: number; text: string }[] = [];
  const assistantMessages: { timestamp: number; text: string; model?: string }[] = [];

  for (const msg of messages) {
    const payload = (msg.payload || msg) as Record<string, unknown>;
    const role = (payload.role as string) || (msg.type as string) || "";
    const tsRaw = msg.timestamp || payload.timestamp;
    const timestamp = tsRaw
      ? typeof tsRaw === "number"
        ? tsRaw
        : new Date(tsRaw as string).getTime()
      : Date.now();

    const text = extractTextFromContent(
      payload.content || payload.text || payload.message
    );
    if (!text.trim()) continue;

    if (role === "user" || role === "user_message") {
      userMessages.push({ timestamp, text });
    } else if (role === "assistant" || role === "agent_message" || role === "assistant_message") {
      assistantMessages.push({
        timestamp,
        text,
        model: (payload.model as string) || undefined,
      });
    }
  }

  for (let i = 0; i < userMessages.length; i++) {
    const user = userMessages[i];
    if (user.text.length < 3) continue;

    const assistant = assistantMessages[i] || null;

    results.push({
      sessionId,
      projectName,
      projectPath: cwd || undefined,
      timestamp: user.timestamp,
      promptText: user.text,
      responsePreview: assistant?.text?.slice(0, 200) || undefined,
      model: assistant?.model || "Command Code",
      rawMetadata: {
        sourceFile: filePath,
      },
    });
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

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return results;
  }

  const obj = (Array.isArray(data) ? { messages: data } : data) as Record<string, unknown>;
  const messages = (obj.messages || obj.conversation || obj.history || []) as Record<string, unknown>[];
  if (!Array.isArray(messages)) return results;

  const sessionId =
    (obj.sessionId as string) ||
    (obj.id as string) ||
    path.basename(filePath, ".json");
  const cwd = (obj.cwd as string) || (obj.workspacePath as string) || "";
  const projectName = cwd ? path.basename(cwd) : "Command Code Session";

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

    const tsRaw = msg.timestamp || msg.createdAt;
    const timestamp = tsRaw
      ? typeof tsRaw === "number"
        ? tsRaw
        : new Date(tsRaw as string).getTime()
      : Date.now();

    results.push({
      sessionId,
      projectName,
      projectPath: cwd || undefined,
      timestamp,
      promptText,
      responsePreview,
      model: model || "Command Code",
      rawMetadata: {
        sourceFile: filePath,
      },
    });
  }

  return results;
}

export const commandCodeAdapter: SourceAdapter = {
  id: "command-code",
  name: "Command Code",
  type: "command-code",
  description: "Imports prompt history from Command Code CLI session logs.",

  getDefaultPath(): string {
    return COMMANDCODE_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(COMMANDCODE_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];
    const files = await findSessionFiles(basePath);

    for (const file of files) {
      try {
        if (file.endsWith(".jsonl")) {
          const parsed = await parseJsonlSessionFile(file);
          results.push(...parsed);
        } else {
          const parsed = await parseJsonSessionFile(file);
          results.push(...parsed);
        }
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(COMMANDCODE_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Command Code directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const files = await findSessionFiles(COMMANDCODE_DIR);
      return {
        status: "healthy",
        message: `Found ${files.length} session file(s)`,
        lastChecked: Date.now(),
        details: { sessionFileCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Command Code directory",
        lastChecked: Date.now(),
      };
    }
  },
};
