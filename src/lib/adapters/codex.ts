import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const CODEX_DIR = path.join(os.homedir(), ".codex");
const SESSIONS_DIR = path.join(CODEX_DIR, "sessions");
const INDEX_FILE = path.join(CODEX_DIR, "session_index.jsonl");

function extractProjectName(cwd: string): string {
  const parts = cwd.split(path.sep).filter(Boolean);
  return parts[parts.length - 1] || "unknown";
}

async function findJsonlFiles(dir: string): Promise<string[]> {
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
        } else if (entry.endsWith(".jsonl") && entry.startsWith("rollout-")) {
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

async function loadSessionTitles(): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  try {
    const content = await fs.promises.readFile(INDEX_FILE, "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.id && obj.thread_name) {
          titles.set(obj.id, obj.thread_name);
        }
      } catch { /* skip */ }
    }
  } catch { /* no index file */ }
  return titles;
}

async function parseJsonlFile(
  filePath: string,
  sessionTitles: Map<string, string>
): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let sessionId = "";
  let cwd = "";
  let modelProvider = "";

  const userMessages: { timestamp: number; text: string }[] = [];
  const agentMessages: { timestamp: number; text: string }[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    const timestamp = obj.timestamp
      ? new Date(obj.timestamp as string).getTime()
      : Date.now();
    const payload = (obj.payload || {}) as Record<string, unknown>;

    if (obj.type === "session_meta") {
      sessionId = (payload.id as string) || "";
      cwd = (payload.cwd as string) || "";
      modelProvider = (payload.model_provider as string) || "openai";
    }

    if (obj.type === "event_msg") {
      const msgType = payload.type as string;
      if (msgType === "user_message") {
        const text = (payload.message as string) || "";
        // Strip IDE context and extract actual user request
        let cleaned = text;
        // Remove IDE context block
        cleaned = cleaned.replace(/^#\s*Context from my IDE setup:[\s\S]*?(?=##\s*My request|$)/m, "");
        // Remove "My request for Codex:" prefix
        cleaned = cleaned.replace(/^##\s*My request for Codex:\s*/m, "");
        // Remove remaining markdown headers about IDE
        cleaned = cleaned.replace(/^##\s*(Active file|Open tabs):.*$/gm, "");
        cleaned = cleaned.replace(/^-\s+\S+:.*$/gm, "");
        cleaned = cleaned.trim();
        if (cleaned && cleaned.length > 2) {
          userMessages.push({ timestamp, text: cleaned });
        }
      } else if (msgType === "agent_message") {
        agentMessages.push({
          timestamp,
          text: (payload.message as string) || "",
        });
      }
    }

    // Also check response_item for user/assistant messages
    if (obj.type === "response_item") {
      const role = payload.role as string;
      const content = (payload.content || []) as Array<Record<string, unknown>>;
      const text = content
        .filter((c) => c.type === "input_text" || c.type === "text")
        .map((c) => (c.text as string) || "")
        .join("\n")
        .trim();

      if (role === "user" && text && !text.startsWith("<") && !text.startsWith("# Context from my IDE")) {
        userMessages.push({ timestamp, text });
      }
    }
  }

  const projectName = extractProjectName(cwd);
  const sessionTitle = sessionTitles.get(sessionId) || null;

  // Pair user messages with agent responses
  for (let i = 0; i < userMessages.length; i++) {
    const user = userMessages[i];
    // Skip very short or noise
    if (user.text.length < 3) continue;
    if (/^\[Request interrupted/i.test(user.text)) continue;

    const agent = agentMessages[i] || null;

    results.push({
      sessionId: sessionId || path.basename(filePath, ".jsonl"),
      projectName,
      projectPath: cwd || undefined,
      timestamp: user.timestamp,
      promptText: user.text,
      responsePreview: agent?.text?.slice(0, 200) || undefined,
      model: modelProvider === "openai" ? "codex" : modelProvider,
      rawMetadata: {
        sessionTitle,
        source: "codex-cli",
      },
    });
  }

  return results;
}

export const codexAdapter: SourceAdapter = {
  id: "codex-cli",
  name: "Codex CLI",
  type: "codex-cli",
  description: "Imports prompt history from OpenAI Codex CLI session logs.",

  getDefaultPath() {
    return SESSIONS_DIR;
  },

  async detect() {
    try {
      await fs.promises.access(SESSIONS_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];
    const files = await findJsonlFiles(basePath);
    const sessionTitles = await loadSessionTitles();

    for (const file of files) {
      try {
        const parsed = await parseJsonlFile(file, sessionTitles);
        results.push(...parsed);
      } catch { /* skip corrupt files */ }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(SESSIONS_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "Codex CLI sessions directory not found",
        lastChecked: Date.now(),
      };
    }

    try {
      const files = await findJsonlFiles(SESSIONS_DIR);
      return {
        status: "healthy",
        message: `Found ${files.length} session file(s)`,
        lastChecked: Date.now(),
        details: { sessionCount: files.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Codex CLI sessions",
        lastChecked: Date.now(),
      };
    }
  },
};
