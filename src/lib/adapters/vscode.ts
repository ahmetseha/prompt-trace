import type { SourceAdapter, ParsedPrompt, AdapterHealth } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Resolve the VS Code workspaceStorage directory based on platform.
 */
function getWorkspaceStorageDir(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Code",
        "User",
        "workspaceStorage"
      );
    case "linux":
      return path.join(os.homedir(), ".config", "Code", "User", "workspaceStorage");
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "Code",
        "User",
        "workspaceStorage"
      );
    default:
      return path.join(os.homedir(), ".config", "Code", "User", "workspaceStorage");
  }
}

/**
 * Resolve the VS Code globalStorage directory for Copilot Chat sessions.
 */
function getGlobalStorageDir(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Code",
        "User",
        "globalStorage",
        "github.copilot-chat"
      );
    case "linux":
      return path.join(
        os.homedir(),
        ".config",
        "Code",
        "User",
        "globalStorage",
        "github.copilot-chat"
      );
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "Code",
        "User",
        "globalStorage",
        "github.copilot-chat"
      );
    default:
      return path.join(
        os.homedir(),
        ".config",
        "Code",
        "User",
        "globalStorage",
        "github.copilot-chat"
      );
  }
}

const WORKSPACE_STORAGE_DIR = getWorkspaceStorageDir();
const GLOBAL_STORAGE_DIR = getGlobalStorageDir();

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
      // folder is typically a file:// URI
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
 * Extract text from a chat message content, handling string and array forms.
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

  // The data may be an array of sessions or an object with sessions inside
  const sessions: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    sessions.push(...data);
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Try common container keys
    if (Array.isArray(obj.sessions)) {
      sessions.push(...obj.sessions);
    } else if (Array.isArray(obj.entries)) {
      sessions.push(...obj.entries);
    } else {
      // Treat the object itself as a single session
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
      [];

    if (!Array.isArray(requests)) continue;

    // Try to pair user/assistant messages
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];

      // Some formats have request/response pairs directly
      if (req.message || req.prompt || req.request) {
        const promptText = extractText(
          req.message || req.prompt || req.request
        );
        if (!promptText.trim()) continue;

        const responseText = extractText(
          req.response || req.result || req.answer
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
          model: (req.model as string) || "Copilot",
          rawMetadata: {
            source: "vscode-state-db",
          },
        });
        continue;
      }

      // Alternatively, role-based messages
      const role = req.role as string | undefined;
      if (role !== "user") continue;

      const promptText = extractText(req.content || req.text || req.value);
      if (!promptText.trim()) continue;

      // Find next assistant message
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
        model: (req.model as string) || "Copilot",
        rawMetadata: {
          source: "vscode-state-db",
        },
      });
    }
  }

  return results;
}

/**
 * Parse global storage JSON session files (github.copilot-chat).
 */
async function parseGlobalStorageSessions(
  dir: string
): Promise<ParsedPrompt[]> {
  const results: ParsedPrompt[] = [];

  let files: string[];
  try {
    files = await fs.promises.readdir(dir);
  } catch {
    return results;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);

    try {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      const parsed = parseSessions(raw, "Copilot Chat");
      results.push(...parsed);
    } catch {
      // Skip corrupt files
    }
  }

  return results;
}

export const vscodeAdapter: SourceAdapter = {
  id: "vscode",
  name: "VS Code (Copilot)",
  type: "copilot" as SourceAdapter["type"],
  description:
    "Imports prompt history from VS Code Copilot Chat sessions stored in workspace databases.",

  getDefaultPath(): string {
    return WORKSPACE_STORAGE_DIR;
  },

  async detect(): Promise<boolean> {
    try {
      await fs.promises.access(WORKSPACE_STORAGE_DIR);
      return true;
    } catch {
      return false;
    }
  },

  async parse(basePath: string): Promise<ParsedPrompt[]> {
    const results: ParsedPrompt[] = [];

    // 1. Parse workspace state.vscdb files
    let workspaces: string[];
    try {
      workspaces = await fs.promises.readdir(basePath);
    } catch {
      workspaces = [];
    }

    let Database: unknown;
    try {
      Database = require("better-sqlite3");
    } catch {
      Database = null;
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

      // Read project info from workspace.json
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
          "SELECT key, value FROM ItemTable WHERE key LIKE '%interactive.sessions%' OR key LIKE '%chat%'"
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

    // 2. Parse global storage session files
    const globalResults = await parseGlobalStorageSessions(GLOBAL_STORAGE_DIR);
    results.push(...globalResults);

    return results;
  },

  async healthCheck(): Promise<AdapterHealth> {
    try {
      await fs.promises.access(WORKSPACE_STORAGE_DIR);
    } catch {
      return {
        status: "unavailable",
        message: "VS Code workspaceStorage directory not found",
        lastChecked: Date.now(),
      };
    }

    let workspaceCount = 0;
    let dbCount = 0;

    try {
      const workspaces = await fs.promises.readdir(WORKSPACE_STORAGE_DIR);
      workspaceCount = workspaces.length;

      for (const ws of workspaces) {
        const dbPath = path.join(WORKSPACE_STORAGE_DIR, ws, "state.vscdb");
        try {
          await fs.promises.access(dbPath);
          dbCount++;
        } catch {
          // No db in this workspace
        }
      }
    } catch {
      return {
        status: "degraded",
        message: "Could not read VS Code workspaceStorage directory",
        lastChecked: Date.now(),
      };
    }

    return {
      status: "healthy",
      message: `Found ${workspaceCount} workspace(s), ${dbCount} with state databases`,
      lastChecked: Date.now(),
      details: { workspaceCount, dbCount },
    };
  },
};
