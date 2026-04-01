import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

function getCopilotDir(): string {
  const platform = os.platform();
  // Check multiple known locations
  const candidates = [
    path.join(os.homedir(), ".copilot"),
    path.join(os.homedir(), ".github-copilot"),
  ];

  if (platform === "darwin") {
    candidates.push(
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "github-copilot"
      )
    );
  } else if (platform === "linux") {
    candidates.push(
      path.join(os.homedir(), ".config", "github-copilot")
    );
  } else if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    candidates.push(path.join(appData, "github-copilot"));
  }

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  // Default fallback
  return path.join(os.homedir(), ".copilot");
}

/**
 * Recursively find session files (JSONL or YAML) under a directory.
 */
async function findSessionFiles(
  dir: string
): Promise<string[]> {
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
        } else if (
          entry.endsWith(".jsonl") ||
          entry.endsWith(".json") ||
          entry.endsWith(".yaml") ||
          entry.endsWith(".yml")
        ) {
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

/**
 * Parse a JSONL session/event log file from Copilot CLI.
 */
async function parseJsonlFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const userMessages: {
    text: string;
    timestamp: number;
    model?: string;
    tokens?: Record<string, unknown>;
  }[] = [];
  const assistantMessages: { text: string; timestamp: number }[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }

    // Extract timestamp
    let timestamp = Date.now();
    if (obj.timestamp) {
      const ts =
        typeof obj.timestamp === "string"
          ? new Date(obj.timestamp).getTime()
          : typeof obj.timestamp === "number"
            ? obj.timestamp
            : NaN;
      if (!isNaN(ts)) timestamp = ts;
    } else if (obj.created_at) {
      const ts = new Date(obj.created_at as string).getTime();
      if (!isNaN(ts)) timestamp = ts;
    }

    const role = (obj.role as string) || (obj.type as string) || "";
    const model = (obj.model as string) || undefined;

    // Extract text content
    let text = "";
    if (typeof obj.content === "string") {
      text = obj.content;
    } else if (typeof obj.message === "string") {
      text = obj.message;
    } else if (typeof obj.prompt === "string") {
      text = obj.prompt;
    } else if (typeof obj.text === "string") {
      text = obj.text;
    } else if (obj.messages && Array.isArray(obj.messages)) {
      // Batch format: array of messages in a single event
      for (const m of obj.messages as Array<Record<string, unknown>>) {
        const mRole = (m.role as string) || "";
        const mText =
          typeof m.content === "string"
            ? m.content
            : typeof m.text === "string"
              ? m.text
              : "";
        if (!mText.trim()) continue;

        const mTimestamp = m.timestamp
          ? new Date(m.timestamp as string).getTime()
          : timestamp;

        if (mRole === "user") {
          userMessages.push({ text: mText, timestamp: mTimestamp, model });
        } else if (mRole === "assistant" || mRole === "copilot") {
          assistantMessages.push({ text: mText, timestamp: mTimestamp });
        }
      }
      continue;
    }

    if (!text.trim()) continue;

    // Token metrics
    const tokens = (obj.usage as Record<string, unknown>) || undefined;

    if (role === "user" || role === "human" || role === "prompt") {
      userMessages.push({ text, timestamp, model, tokens });
    } else if (
      role === "assistant" ||
      role === "copilot" ||
      role === "response" ||
      role === "completion"
    ) {
      assistantMessages.push({ text, timestamp });
    }
  }

  const sessionId = path.basename(filePath, path.extname(filePath));

  for (let i = 0; i < userMessages.length; i++) {
    const user = userMessages[i];
    if (user.text.trim().length < 2) continue;

    const assistant = assistantMessages[i] || null;

    results.push({
      sessionId,
      timestamp: user.timestamp,
      promptText: user.text.trim(),
      responsePreview: assistant?.text?.slice(0, 200) || undefined,
      model: user.model || "copilot",
      rawMetadata: {
        source: "copilot-cli",
        sourceFile: filePath,
        usage: user.tokens,
      },
    });
  }

  return results;
}

/**
 * Parse a JSON session file from Copilot CLI.
 */
async function parseJsonFile(filePath: string): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileName = path.basename(filePath);

  // Skip known non-session files
  if (
    fileName === "config.json" ||
    fileName === "settings.json" ||
    fileName === "hosts.json" ||
    fileName === "versions.json"
  ) {
    return results;
  }

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

  // Look for conversation/messages arrays
  const candidateArrays = [
    data.messages,
    data.conversation,
    data.events,
    data.turns,
  ];

  for (const arr of candidateArrays) {
    if (!Array.isArray(arr) || arr.length === 0) continue;

    const messages = arr as Array<Record<string, unknown>>;
    const sessionId =
      (data.sessionId as string) ||
      (data.id as string) ||
      path.basename(filePath, ".json");
    const model = (data.model as string) || undefined;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = (msg.role as string) || "";
      if (role !== "user" && role !== "human") continue;

      const text =
        typeof msg.content === "string"
          ? msg.content
          : typeof msg.text === "string"
            ? msg.text
            : "";
      if (!text.trim()) continue;

      // Find next assistant
      let responsePreview: string | undefined;
      for (let j = i + 1; j < messages.length; j++) {
        const r = (messages[j].role as string) || "";
        if (r === "assistant" || r === "copilot") {
          const rText =
            typeof messages[j].content === "string"
              ? messages[j].content as string
              : typeof messages[j].text === "string"
                ? messages[j].text as string
                : "";
          responsePreview = rText.slice(0, 200) || undefined;
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
      }

      results.push({
        sessionId,
        timestamp,
        promptText: text.trim(),
        responsePreview,
        model: model || "copilot",
        rawMetadata: {
          source: "copilot-cli",
          sourceFile: filePath,
        },
      });
    }

    if (results.length > 0) break;
  }

  return results;
}

export const copilotCliAdapter: SourceAdapter = {
  id: "copilot-cli",
  name: "Copilot CLI",
  type: "copilot-cli",
  description:
    "Imports prompt history from GitHub Copilot CLI session logs.",

  getDefaultPath(): string {
    return getCopilotDir();
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(getCopilotDir());
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
        // YAML files: skip for now unless a YAML parser is available
        // Could add yaml parsing with a dynamic require in the future
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    const copilotDir = getCopilotDir();
    try {
      await fs.promises.access(copilotDir);
    } catch {
      return {
        status: "unavailable",
        message: "Copilot CLI directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const files = await findSessionFiles(copilotDir);
      return {
        status: "healthy",
        message: `Found ${files.length} session file(s)`,
        lastChecked: Date.now(),
        details: { sessionFileCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Copilot CLI directory",
        lastChecked: Date.now(),
      };
    }
  },
};
