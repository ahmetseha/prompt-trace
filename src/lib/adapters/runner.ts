import { getAdapter, getAllAdapters, type ParsedPrompt } from "./index";
import { classifyPrompt } from "@/lib/classification";
import { scorePrompt } from "@/lib/scoring";
import { generateId, estimateTokens, estimateCost } from "@/lib/utils";
import type {
  Source,
  Project,
  Session,
  Prompt,
  PromptFile,
  PromptTag,
} from "@/lib/types";

export interface IngestResult {
  sourceId: string;
  promptsIngested: number;
  sessionsCreated: number;
  projectsFound: number;
  errors: string[];
}

/**
 * Discover which adapters are available on this machine.
 */
export async function discoverSources(): Promise<
  { adapterId: string; name: string; available: boolean }[]
> {
  const all = getAllAdapters();
  const results: { adapterId: string; name: string; available: boolean }[] = [];

  for (const adapter of all) {
    let available = false;
    try {
      available = await adapter.detect();
    } catch {
      // detection failed, treat as unavailable
    }
    results.push({ adapterId: adapter.id, name: adapter.name, available });
  }

  return results;
}

/**
 * Run a single adapter, return parsed prompts.
 */
export async function parseSource(
  sourceType: string,
  basePath?: string
): Promise<ParsedPrompt[]> {
  const adapter = getAdapter(sourceType);
  if (!adapter) {
    throw new Error(`Unknown adapter type: ${sourceType}`);
  }

  const resolvedPath = basePath || adapter.getDefaultPath();
  return adapter.parse(resolvedPath);
}

/**
 * Extract common keyword tags from prompt text.
 */
function extractKeywordTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  const keywords: Record<string, string> = {
    react: "react",
    nextjs: "nextjs",
    "next.js": "nextjs",
    typescript: "typescript",
    python: "python",
    rust: "rust",
    golang: "golang",
    docker: "docker",
    kubernetes: "kubernetes",
    database: "database",
    sql: "sql",
    api: "api",
    graphql: "graphql",
    css: "css",
    tailwind: "tailwind",
    testing: "testing",
    jest: "jest",
    vitest: "vitest",
    webpack: "webpack",
    vite: "vite",
    git: "git",
    ci: "ci-cd",
    deploy: "deployment",
    auth: "auth",
    security: "security",
    performance: "performance",
    migration: "migration",
  };

  for (const [keyword, tag] of Object.entries(keywords)) {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // Cap at 5 keyword tags
}

/**
 * Transform ParsedPrompt[] into database-ready entities.
 */
export function transformParsedData(
  parsed: ParsedPrompt[],
  sourceId: string
): {
  source: Source;
  projects: Project[];
  sessions: Session[];
  prompts: Prompt[];
  promptFiles: PromptFile[];
  promptTags: PromptTag[];
} {
  const now = Date.now();

  // -- Source entity --
  const source: Source = {
    id: sourceId,
    name: sourceId, // Will be overridden by caller if needed
    type: sourceId.includes("cursor") ? "cursor" : "claude-code",
    enabled: 1,
    status: "active",
    lastScannedAt: now,
    metadataJson: null,
    createdAt: now,
    updatedAt: now,
  };

  // -- Group by project --
  const projectMap = new Map<
    string,
    { name: string; path: string; firstSeen: number; lastSeen: number }
  >();
  const projectIdMap = new Map<string, string>(); // projectKey -> id

  for (const p of parsed) {
    const key = p.projectPath || p.projectName || "unknown";
    const existing = projectMap.get(key);
    if (existing) {
      existing.firstSeen = Math.min(existing.firstSeen, p.timestamp);
      existing.lastSeen = Math.max(existing.lastSeen, p.timestamp);
    } else {
      const id = generateId();
      projectMap.set(key, {
        name: p.projectName || "unknown",
        path: p.projectPath || key,
        firstSeen: p.timestamp,
        lastSeen: p.timestamp,
      });
      projectIdMap.set(key, id);
    }
  }

  const projects: Project[] = [];
  for (const [key, data] of projectMap.entries()) {
    projects.push({
      id: projectIdMap.get(key)!,
      name: data.name,
      path: data.path,
      firstSeenAt: data.firstSeen,
      lastSeenAt: data.lastSeen,
      createdAt: now,
      updatedAt: now,
    });
  }

  // -- Group by session --
  const sessionMap = new Map<
    string,
    {
      projectKey: string;
      startedAt: number;
      endedAt: number;
      promptCount: number;
      models: Set<string>;
      title: string | null;
    }
  >();
  const sessionIdMap = new Map<string, string>(); // externalSessionId -> internal id

  for (const p of parsed) {
    const sessKey = p.sessionId || "unknown";
    const existing = sessionMap.get(sessKey);
    if (existing) {
      existing.startedAt = Math.min(existing.startedAt, p.timestamp);
      existing.endedAt = Math.max(existing.endedAt, p.timestamp);
      existing.promptCount++;
      if (p.model) existing.models.add(p.model);
    } else {
      const id = generateId();
      const sessionTitle = (p.rawMetadata?.sessionTitle as string) || null;
      sessionMap.set(sessKey, {
        projectKey: p.projectPath || p.projectName || "unknown",
        startedAt: p.timestamp,
        endedAt: p.timestamp,
        promptCount: 1,
        models: new Set(p.model ? [p.model] : []),
        title: sessionTitle,
      });
      sessionIdMap.set(sessKey, id);
    }
  }

  // Generate fallback titles from first prompt text in each session
  for (const p of parsed) {
    const sessKey = p.sessionId || "unknown";
    const sess = sessionMap.get(sessKey);
    if (sess && !sess.title) {
      // Use first 60 chars of prompt as title
      const text = p.promptText.trim().replace(/\s+/g, " ");
      sess.title = text.length > 60 ? text.slice(0, 57) + "..." : text;
    }
  }

  const sessions: Session[] = [];
  for (const [extId, data] of sessionMap.entries()) {
    const projectId = projectIdMap.get(data.projectKey) || null;
    sessions.push({
      id: sessionIdMap.get(extId)!,
      sourceId,
      projectId,
      externalSessionId: extId,
      title: data.title,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      promptCount: data.promptCount,
      modelSummaryJson:
        data.models.size > 0
          ? JSON.stringify(Object.fromEntries([...data.models].map((m) => [m, 1])))
          : null,
      metadataJson: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // -- Prompts, files, tags --
  const prompts: Prompt[] = [];
  const promptFiles: PromptFile[] = [];
  const promptTags: PromptTag[] = [];

  for (const p of parsed) {
    const promptId = generateId();
    const projectKey = p.projectPath || p.projectName || "unknown";
    const projectId = projectIdMap.get(projectKey) || null;
    const sessionInternalId = sessionIdMap.get(p.sessionId || "unknown") || null;

    // Classify
    const { category, intent } = classifyPrompt(p.promptText);

    // Score
    const { reuseScore, successScore } = scorePrompt({
      promptText: p.promptText,
      category,
      intent,
      filesCount: p.filesTouched?.length || 0,
      responsePreview: p.responsePreview,
    });

    // Token estimate
    const rawUsage = p.rawMetadata?.totalTokens as number | undefined;
    const tokenEstimate =
      rawUsage && rawUsage > 0 ? rawUsage : estimateTokens(p.promptText);

    const model = p.model || "unknown";
    const costEstimate = estimateCost(tokenEstimate, model);

    prompts.push({
      id: promptId,
      sourceId,
      projectId,
      sessionId: sessionInternalId,
      timestamp: p.timestamp,
      promptText: p.promptText,
      responsePreview: p.responsePreview || null,
      model: p.model || null,
      promptLength: p.promptText.length,
      category,
      intent,
      tokenEstimate,
      costEstimate,
      successScore,
      reuseScore,
      metadataJson: p.rawMetadata ? JSON.stringify(p.rawMetadata) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Prompt files
    if (p.filesTouched) {
      const fileActions = (p.rawMetadata?.fileActions as { filePath: string; action: string }[]) || [];
      const actionMap = new Map(fileActions.map((fa) => [fa.filePath, fa.action]));

      for (const fp of p.filesTouched) {
        promptFiles.push({
          id: generateId(),
          promptId,
          filePath: fp,
          actionType: actionMap.get(fp) || null,
          createdAt: now,
        });
      }
    }

    // Tags: category + keyword tags
    const tags = new Set<string>();
    if (category !== "unknown") tags.add(category);
    for (const kw of extractKeywordTags(p.promptText)) {
      tags.add(kw);
    }

    for (const tag of tags) {
      promptTags.push({
        id: generateId(),
        promptId,
        tag,
      });
    }
  }

  return { source, projects, sessions, prompts, promptFiles, promptTags };
}
