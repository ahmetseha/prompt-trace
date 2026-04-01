import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

/**
 * Resolve the Windsurf workspaceStorage directory based on platform.
 */
function getWorkspaceStorageDir(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Windsurf",
        "User",
        "workspaceStorage"
      );
    case "linux":
      return path.join(os.homedir(), ".config", "Windsurf", "User", "workspaceStorage");
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "Windsurf",
        "User",
        "workspaceStorage"
      );
    default:
      return path.join(os.homedir(), ".config", "Windsurf", "User", "workspaceStorage");
  }
}

/**
 * Resolve the Windsurf transcripts directory (alternative storage).
 */
function getTranscriptsDir(): string {
  return path.join(os.homedir(), ".windsurf", "transcripts");
}

const WORKSPACE_STORAGE_DIR = getWorkspaceStorageDir();
const TRANSCRIPTS_DIR = getTranscriptsDir();

/**
 * Read workspace.json from a workspace hash directory to extract the project path.
 */
async function readWorkspaceProject(
  wsDir: string
): Promise<{ projectName: string; projectPath: string } | null> {
  const wsJsonPath = path.join(wsDir, "workspace.json");
  try {
    const raw = await fs.promises.readFile(wsJsonPath, "utf-8");
    const data = JSON.parse(raw);
    const folder = data.folder as string | undefined;
    if (folder) {
      const decoded = decodeURIComponent(folder.replace(/^file:\/\//, ""));
      const name = path.basename(decoded) || decoded;
      return { projectName: name, projectPath: decoded };
    }
  } catch {
    // workspace.json may not exist or be readable
  }
  return null;
}

/**
 * Extract text from chat message content.
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
 * Parse chat sessions from a JSON blob extracted from state.vscdb.
 */
function parseSessions(
  raw: string,
  projectName: string,
  projectPath?: string
): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return results;
  }

  const sessions: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    sessions.push(...data);
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.sessions)) {
      sessions.push(...obj.sessions);
    } else if (Array.isArray(obj.entries)) {
      sessions.push(...obj.entries);
    } else if (Array.isArray(obj.cascades)) {
      sessions.push(...obj.cascades);
    } else {
      sessions.push(obj);
    }
  }

  for (const session of sessions) {
    const sessionId =
      (session.sessionId as string) ||
      (session.id as string) ||
      undefined;

    const requests =
      (session.requests as Record<string, unknown>[]) ||
      (session.exchanges as Record<string, unknown>[]) ||
      (session.messages as Record<string, unknown>[]) ||
      (session.turns as Record<string, unknown>[]) ||
      [];

    if (!Array.isArray(requests)) continue;

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];

      // Direct request/response pair format
      if (req.message || req.prompt || req.request || req.userMessage) {
        const promptText = extractText(
          req.message || req.prompt || req.request || req.userMessage
        );
        if (!promptText.trim()) continue;

        const responseText = extractText(
          req.response || req.result || req.answer || req.assistantMessage
        );
        const responsePreview = responseText
          ? responseText.slice(0, 200)
          : undefined;

        const timestamp =
          (req.timestamp as number) ||
          (req.createdAt as number) ||
          (typeof req.timestamp === "string"
            ? new Date(req.timestamp as string).getTime()
            : 0) ||
          Date.now();

        results.push({
          externalId: (req.id as string) || undefined,
          sessionId,
          projectName,
          projectPath,
          timestamp,
          promptText,
          responsePreview,
          model: (req.model as string) || "Windsurf Cascade",
          rawMetadata: {
            source: "windsurf-state-db",
          },
        });
        continue;
      }

      // Role-based messages
      const role = req.role as string | undefined;
      if (role !== "user") continue;

      const promptText = extractText(req.content || req.text || req.value);
      if (!promptText.trim()) continue;

      let responsePreview: string | undefined;
      for (let j = i + 1; j < requests.length; j++) {
        const r = requests[j] as Record<string, unknown>;
        if (r.role === "assistant") {
          const respText = extractText(r.content || r.text || r.value);
          responsePreview = respText ? respText.slice(0, 200) : undefined;
          break;
        }
        if (r.role === "user") break;
      }

      const timestamp =
        (req.timestamp as number) ||
        (req.createdAt as number) ||
        (typeof req.timestamp === "string"
          ? new Date(req.timestamp as string).getTime()
          : 0) ||
        Date.now();

      results.push({
        externalId: (req.id as string) || undefined,
        sessionId,
        projectName,
        projectPath,
        timestamp,
        promptText,
        responsePreview,
        model: (req.model as string) || "Windsurf Cascade",
        rawMetadata: {
          source: "windsurf-state-db",
        },
      });
    }
  }

  return results;
}

/**
 * Parse JSONL transcript files from ~/.windsurf/transcripts/.
 */
async function parseTranscriptFile(filePath: string): Promise<ParsedPrompt[]> {
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
      // Skip malformed lines
    }
  }

  const sessionId = path.basename(filePath, path.extname(filePath));

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = (msg.role as string) || (msg.type as string);
    if (role !== "user") continue;

    const promptText = extractText(
      msg.content || msg.message || msg.text
    );
    if (!promptText.trim()) continue;

    // Find next assistant message
    let responsePreview: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      const r = messages[j];
      const rRole = (r.role as string) || (r.type as string);
      if (rRole === "assistant") {
        const respText = extractText(r.content || r.message || r.text);
        responsePreview = respText ? respText.slice(0, 200) : undefined;
        break;
      }
      if (rRole === "user") break;
    }

    const timestamp =
      (msg.timestamp as number) ||
      (typeof msg.timestamp === "string"
        ? new Date(msg.timestamp as string).getTime()
        : 0) ||
      Date.now();

    results.push({
      externalId: (msg.id as string) || undefined,
      sessionId,
      projectName: (msg.project as string) || "Windsurf",
      projectPath: (msg.cwd as string) || undefined,
      timestamp,
      promptText,
      responsePreview,
      model: (msg.model as string) || "Windsurf Cascade",
      rawMetadata: {
        source: "windsurf-transcript",
        sourceFile: filePath,
      },
    });
  }

  return results;
}

export const windsurfAdapter: SourceAdapter = {
  id: "windsurf",
  name: "Windsurf",
  type: "windsurf" as SourceAdapter["type"],
  description:
    "Imports prompt history from Windsurf (Codeium) editor chat sessions and Cascade transcripts.",

  getDefaultPath(): string {
    return WORKSPACE_STORAGE_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(WORKSPACE_STORAGE_DIR);
      return true;
    } catch {
      // Also check for transcripts dir
      try {
        await fs.promises.access(TRANSCRIPTS_DIR);
        return true;
      } catch {
        return false;
      }
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    // 1. Parse workspace state.vscdb files (VS Code fork pattern)
    let Database: unknown;
    try {
      Database = require("better-sqlite3");
    } catch {
      Database = null;
    }

    let workspaces: string[];
    try {
      workspaces = await fs.promises.readdir(basePath);
    } catch {
      workspaces = [];
    }

    for (const ws of workspaces) {
      const wsDir = path.join(basePath, ws);

      let stat: fs.Stats;
      try {
        stat = await fs.promises.stat(wsDir);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;

      const projectInfo = await readWorkspaceProject(wsDir);
      const projectName = projectInfo?.projectName || ws;
      const projectPath = projectInfo?.projectPath || undefined;

      if (!Database) continue;

      const dbPath = path.join(wsDir, "state.vscdb");
      try {
        await fs.promises.access(dbPath);
      } catch {
        continue;
      }

      try {
        const db = new (Database as new (...args: unknown[]) => Record<string, (...args: unknown[]) => unknown>)(dbPath, {
          readonly: true,
        });

        const rows = (
          db.prepare as (sql: string) => { all: () => { key: string; value: string }[] }
        )(
          "SELECT key, value FROM ItemTable WHERE key LIKE '%interactive.sessions%' OR key LIKE '%cascade.sessions%' OR key LIKE '%chat%'"
        ).all();

        (db.close as () => void)();

        for (const row of rows) {
          if (!row.value) continue;
          try {
            const parsed = parseSessions(row.value, projectName, projectPath);
            results.push(...parsed);
          } catch {
            // Skip unparseable values
          }
        }
      } catch {
        // Skip corrupt databases
      }
    }

    // 2. Parse JSONL transcript files
    let transcriptFiles: string[];
    try {
      transcriptFiles = await fs.promises.readdir(TRANSCRIPTS_DIR);
    } catch {
      transcriptFiles = [];
    }

    for (const file of transcriptFiles) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = path.join(TRANSCRIPTS_DIR, file);

      try {
        const parsed = await parseTranscriptFile(filePath);
        results.push(...parsed);
      } catch {
        // Skip corrupt files
      }
    }

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    let wsExists = false;
    let transcriptsExist = false;

    try {
      await fs.promises.access(WORKSPACE_STORAGE_DIR);
      wsExists = true;
    } catch {
      // Not available
    }

    try {
      await fs.promises.access(TRANSCRIPTS_DIR);
      transcriptsExist = true;
    } catch {
      // Not available
    }

    if (!wsExists && !transcriptsExist) {
      return {
        status: "unavailable",
        message: "Windsurf data directories not found",
        lastChecked: Date.now(),
      };
    }

    let workspaceCount = 0;
    let dbCount = 0;
    let transcriptCount = 0;

    try {
      if (wsExists) {
        const workspaces = await fs.promises.readdir(WORKSPACE_STORAGE_DIR);
        workspaceCount = workspaces.length;

        for (const ws of workspaces) {
          const dbPath = path.join(WORKSPACE_STORAGE_DIR, ws, "state.vscdb");
          try {
            await fs.promises.access(dbPath);
            dbCount++;
          } catch {
            // No db
          }
        }
      }

      if (transcriptsExist) {
        const files = await fs.promises.readdir(TRANSCRIPTS_DIR);
        transcriptCount = files.filter((f) => f.endsWith(".jsonl")).length;
      }
    } catch {
      return {
        status: "degraded",
        message: "Could not fully read Windsurf data directories",
        lastChecked: Date.now(),
      };
    }

    return {
      status: "healthy",
      message: `Found ${workspaceCount} workspace(s), ${dbCount} databases, ${transcriptCount} transcript(s)`,
      lastChecked: Date.now(),
      details: { workspaceCount, dbCount, transcriptCount },
    };
  },
};
