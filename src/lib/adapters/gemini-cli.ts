import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

function getGeminiDir(): string {
  return path.join(os.homedir(), ".gemini");
}

/**
 * Recursively find all .json files under a directory.
 */
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

/** Files that are not conversation data. */
const SKIP_FILENAMES = new Set([
  "manifest.json",
  "config.json",
  "settings.json",
  "preferences.json",
  "metadata.json",
]);

/**
 * Try to extract conversation messages from a Gemini CLI checkpoint JSON file.
 * Returns parsed prompts or an empty array if the file is not a conversation file.
 */
async function parseCheckpointFile(filePath: string): Promise<ParsedPrompt[]> {
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

  // Look for conversation messages in common Gemini CLI structures
  const messages = extractMessages(data);
  if (messages.length === 0) return results;

  const model = (data.model as string) || (data.modelName as string) || undefined;
  const sessionId =
    (data.sessionId as string) ||
    (data.id as string) ||
    path.basename(filePath, ".json");

  // Derive project name from parent directory structure
  const parentDir = path.basename(path.dirname(filePath));
  const projectName = parentDir !== "tmp" && parentDir !== "sessions"
    ? parentDir
    : undefined;

  // Pair user messages with assistant responses
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;

    const promptText = msg.text.trim();
    if (!promptText) continue;

    // Find next assistant message
    let responsePreview: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === "assistant" || messages[j].role === "model") {
        responsePreview = messages[j].text.slice(0, 200) || undefined;
        break;
      }
      if (messages[j].role === "user") break;
    }

    const timestamp = msg.timestamp || Date.now();

    results.push({
      sessionId,
      projectName,
      timestamp,
      promptText,
      responsePreview,
      model,
      rawMetadata: {
        source: "gemini-cli",
        sourceFile: filePath,
      },
    });
  }

  return results;
}

interface ExtractedMessage {
  role: string;
  text: string;
  timestamp: number;
}

/**
 * Extract messages from various possible Gemini CLI JSON structures.
 */
function extractMessages(data: Record<string, unknown>): ExtractedMessage[] {
  const results: ExtractedMessage[] = [];

  // Try common field names for conversation history
  const candidateArrays = [
    data.messages,
    data.conversation,
    data.history,
    data.turns,
    data.contents,
    (data.checkpoint as Record<string, unknown>)?.messages,
    (data.checkpoint as Record<string, unknown>)?.conversation,
    (data.state as Record<string, unknown>)?.messages,
  ];

  for (const arr of candidateArrays) {
    if (!Array.isArray(arr) || arr.length === 0) continue;

    for (const entry of arr) {
      if (!entry || typeof entry !== "object") continue;
      const msg = entry as Record<string, unknown>;

      const role = (msg.role as string) || "";
      if (!role) continue;

      // Normalize role
      const normalizedRole =
        role === "model" || role === "assistant" ? "assistant" : role;

      // Extract text from different content structures
      let text = "";
      if (typeof msg.content === "string") {
        text = msg.content;
      } else if (typeof msg.text === "string") {
        text = msg.text;
      } else if (Array.isArray(msg.parts)) {
        text = (msg.parts as Array<Record<string, unknown>>)
          .filter((p) => typeof p.text === "string")
          .map((p) => p.text as string)
          .join("\n");
      } else if (Array.isArray(msg.content)) {
        text = (msg.content as Array<Record<string, unknown>>)
          .filter(
            (c) =>
              (c.type === "text" && typeof c.text === "string") ||
              typeof c === "string"
          )
          .map((c) =>
            typeof c === "string" ? c : (c.text as string) || ""
          )
          .join("\n");
      }

      if (!text.trim()) continue;

      let timestamp = Date.now();
      if (msg.timestamp) {
        const ts =
          typeof msg.timestamp === "string"
            ? new Date(msg.timestamp).getTime()
            : (msg.timestamp as number);
        if (!isNaN(ts)) timestamp = ts;
      } else if (msg.createTime) {
        const ts =
          typeof msg.createTime === "string"
            ? new Date(msg.createTime).getTime()
            : (msg.createTime as number);
        if (!isNaN(ts)) timestamp = ts;
      }

      results.push({ role: normalizedRole, text, timestamp });
    }

    // If we found messages in one candidate, stop looking
    if (results.length > 0) break;
  }

  return results;
}

export const geminiCliAdapter: SourceAdapter = {
  id: "gemini-cli",
  name: "Gemini CLI",
  type: "gemini-cli",
  description:
    "Imports prompt history from Gemini CLI conversation checkpoint files.",

  getDefaultPath(): string {
    return getGeminiDir();
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(getGeminiDir());
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    const jsonFiles = await findJsonFiles(basePath);

    for (const file of jsonFiles) {
      try {
        const parsed = await parseCheckpointFile(file);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    const geminiDir = getGeminiDir();
    try {
      await fs.promises.access(geminiDir);
    } catch {
      return {
        status: "unavailable",
        message: "Gemini CLI directory not found (~/.gemini/)",
        lastChecked: Date.now(),
      };
    }

    try {
      const jsonFiles = await findJsonFiles(geminiDir);
      return {
        status: "healthy",
        message: `Found ${jsonFiles.length} JSON file(s)`,
        lastChecked: Date.now(),
        details: { jsonFileCount: jsonFiles.length },
      };
    } catch {
      return {
        status: "degraded",
        message: "Could not read Gemini CLI directory",
        lastChecked: Date.now(),
      };
    }
  },
};
