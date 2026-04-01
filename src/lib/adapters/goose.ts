import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

function getGooseDir(): string {
  const platform = os.platform();

  // Check multiple known locations
  const candidates = [
    path.join(os.homedir(), ".goose", "sessions"),
    path.join(os.homedir(), ".config", "goose", "sessions"),
  ];

  if (platform === "darwin") {
    candidates.push(
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "goose",
        "sessions"
      )
    );
  } else if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    candidates.push(path.join(appData, "goose", "sessions"));
  }

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  // Default fallback
  return path.join(os.homedir(), ".config", "goose", "sessions");
}

function getGooseBaseDir(): string {
  const candidates = [
    path.join(os.homedir(), ".goose"),
    path.join(os.homedir(), ".config", "goose"),
  ];

  if (os.platform() === "darwin") {
    candidates.push(
      path.join(os.homedir(), "Library", "Application Support", "goose")
    );
  }

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  return path.join(os.homedir(), ".config", "goose");
}

/**
 * Recursively find session files (JSON or JSONL) under a directory.
 */
async function findSessionFiles(dir: string): Promise<string[]> {
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
        } else if (entry.endsWith(".jsonl") || entry.endsWith(".json")) {
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

/** Files that are not session data. */
const SKIP_FILENAMES = new Set([
  "config.json",
  "settings.json",
  "profiles.json",
  "metadata.json",
]);

/**
 * Parse a JSONL session file from Goose.
 */
async function parseJsonlFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const messages: { role: string; text: string; timestamp: number; model?: string }[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const role = (obj.role as string) || "";
    if (!role) continue;

    // Extract text
    let text = "";
    if (typeof obj.content === "string") {
      text = obj.content;
    } else if (typeof obj.text === "string") {
      text = obj.text;
    } else if (typeof obj.message === "string") {
      text = obj.message;
    } else if (Array.isArray(obj.content)) {
      text = (obj.content as Array<Record<string, unknown>>)
        .filter(
          (c) =>
            (c.type === "text" && typeof c.text === "string") ||
            typeof c === "string"
        )
        .map((c) => (typeof c === "string" ? c : (c.text as string) || ""))
        .join("\n");
    }

    if (!text.trim()) continue;

    let timestamp = Date.now();
    if (obj.timestamp) {
      const ts =
        typeof obj.timestamp === "string"
          ? new Date(obj.timestamp).getTime()
          : (obj.timestamp as number);
      if (!isNaN(ts)) timestamp = ts;
    } else if (obj.created_at) {
      const ts = new Date(obj.created_at as string).getTime();
      if (!isNaN(ts)) timestamp = ts;
    }

    const model = (obj.model as string) || undefined;

    messages.push({ role, text, timestamp, model });
  }

  const sessionId = path.basename(filePath, path.extname(filePath));

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user" && msg.role !== "human") continue;

    const promptText = msg.text.trim();
    if (promptText.length < 2) continue;

    // Find next assistant response
    let responsePreview: string | undefined;
    let model = msg.model;
    for (let j = i + 1; j < messages.length; j++) {
      const r = messages[j].role;
      if (r === "assistant" || r === "model") {
        responsePreview = messages[j].text.slice(0, 200) || undefined;
        if (!model) model = messages[j].model;
        break;
      }
      if (r === "user" || r === "human") break;
    }

    results.push({
      sessionId,
      timestamp: msg.timestamp,
      promptText,
      responsePreview,
      model: model || "goose",
      rawMetadata: {
        source: "goose",
        sourceFile: filePath,
      },
    });
  }

  return results;
}

/**
 * Parse a JSON session file from Goose.
 */
async function parseJsonFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileName = path.basename(filePath);

  if (SKIP_FILENAMES.has(fileName)) return results;

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

  // Look for conversation messages in common Goose structures
  const candidateArrays = [
    data.messages,
    data.conversation,
    data.history,
    data.turns,
    (data.session as Record<string, unknown>)?.messages,
  ];

  for (const arr of candidateArrays) {
    if (!Array.isArray(arr) || arr.length === 0) continue;

    const messages = arr as Array<Record<string, unknown>>;
    const sessionId =
      (data.sessionId as string) ||
      (data.id as string) ||
      (data.session_id as string) ||
      path.basename(filePath, ".json");
    const sessionModel = (data.model as string) || undefined;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = (msg.role as string) || "";
      if (role !== "user" && role !== "human") continue;

      let text = "";
      if (typeof msg.content === "string") {
        text = msg.content;
      } else if (typeof msg.text === "string") {
        text = msg.text;
      } else if (Array.isArray(msg.content)) {
        text = (msg.content as Array<Record<string, unknown>>)
          .filter(
            (c) =>
              (c.type === "text" && typeof c.text === "string") ||
              typeof c === "string"
          )
          .map((c) => (typeof c === "string" ? c : (c.text as string) || ""))
          .join("\n");
      }

      if (!text.trim()) continue;

      // Find next assistant
      let responsePreview: string | undefined;
      let model = sessionModel;
      for (let j = i + 1; j < messages.length; j++) {
        const r = (messages[j].role as string) || "";
        if (r === "assistant" || r === "model") {
          const rText =
            typeof messages[j].content === "string"
              ? (messages[j].content as string)
              : typeof messages[j].text === "string"
                ? (messages[j].text as string)
                : "";
          responsePreview = rText.slice(0, 200) || undefined;
          if (!model) model = (messages[j].model as string) || undefined;
          break;
        }
        if (r === "user" || r === "human") break;
      }

      let timestamp = Date.now();
      if (msg.timestamp) {
        const ts =
          typeof msg.timestamp === "string"
            ? new Date(msg.timestamp).getTime()
            : (msg.timestamp as number);
        if (!isNaN(ts)) timestamp = ts;
      } else if (msg.created_at) {
        const ts = new Date(msg.created_at as string).getTime();
        if (!isNaN(ts)) timestamp = ts;
      }

      results.push({
        sessionId,
        timestamp,
        promptText: text.trim(),
        responsePreview,
        model: model || "goose",
        rawMetadata: {
          source: "goose",
          sourceFile: filePath,
        },
      });
    }

    if (results.length > 0) break;
  }

  return results;
}

export const gooseAdapter: SourceAdapter = {
  id: "goose",
  name: "Goose",
  type: "goose",
  description:
    "Imports prompt history from Goose AI agent session files.",

  getDefaultPath(): string {
    return getGooseDir();
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(getGooseBaseDir());
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
          const parsed = await parseJsonlFile(file);
          results.push(...parsed);
        } else if (file.endsWith(".json")) {
          const parsed = await parseJsonFile(file);
          results.push(...parsed);
        }
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    const baseDir = getGooseBaseDir();
    try {
      await fs.promises.access(baseDir);
    } catch {
      return {
        status: "unavailable",
        message: "Goose data directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const sessionsDir = getGooseDir();
      const files = await findSessionFiles(sessionsDir);
      return {
        status: "healthy",
        message: `Found ${files.length} session file(s)`,
        lastChecked: Date.now(),
        details: { sessionFileCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Goose sessions directory",
        lastChecked: Date.now(),
      };
    }
  },
};
