import { eq, desc, asc, sql, like, and, or, count, avg, sum, inArray } from 'drizzle-orm';
import { db } from './index';
import * as schema from './schema';
import type {
  DashboardStats,
  Prompt,
  PromptFile,
  Session,
  Project,
  Source,
  TemplateCandidate,
  FilterState,
  PromptCategory,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultStats(): DashboardStats {
  return {
    totalPrompts: 0,
    totalSessions: 0,
    totalProjects: 0,
    totalSources: 0,
    totalTokens: 0,
    totalCost: 0,
    avgSuccessScore: 0,
    avgReuseScore: 0,
    promptsByCategory: {} as Record<PromptCategory, number>,
    promptsByModel: {},
    promptsByDay: [],
    topProjects: [],
    recentPrompts: [],
  };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [promptRows] = await Promise.all([
      db.select().from(schema.prompts).all(),
    ]);

    const totalPrompts = promptRows.length;
    const sessionRows = db.select().from(schema.sessions).all();
    const projectRows = db.select().from(schema.projects).all();
    const sourceRows = db.select().from(schema.sources).all();

    const totalSessions = sessionRows.length;
    const totalProjects = projectRows.length;
    const totalSources = sourceRows.length;

    let totalTokens = 0;
    let totalCost = 0;
    let successSum = 0;
    let successCount = 0;
    let reuseSum = 0;
    let reuseCount = 0;
    const categoryMap: Record<string, number> = {};
    const modelMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};

    for (const p of promptRows) {
      if (p.tokenEstimate) totalTokens += p.tokenEstimate;
      if (p.costEstimate) totalCost += p.costEstimate;
      if (p.successScore != null) { successSum += p.successScore; successCount++; }
      if (p.reuseScore != null) { reuseSum += p.reuseScore; reuseCount++; }
      if (p.category) categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      if (p.model) modelMap[p.model] = (modelMap[p.model] || 0) + 1;
      if (p.timestamp) {
        const date = new Date(p.timestamp).toISOString().slice(0, 10);
        dayMap[date] = (dayMap[date] || 0) + 1;
      }
    }

    const promptsByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const topProjects = projectRows
      .map((proj) => {
        const promptCount = promptRows.filter((p) => p.projectId === proj.id).length;
        return { id: proj.id, name: proj.name, promptCount };
      })
      .sort((a, b) => b.promptCount - a.promptCount)
      .slice(0, 5);

    const recentPrompts = promptRows
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, 10) as Prompt[];

    return {
      totalPrompts,
      totalSessions,
      totalProjects,
      totalSources,
      totalTokens,
      totalCost,
      avgSuccessScore: successCount ? successSum / successCount : 0,
      avgReuseScore: reuseCount ? reuseSum / reuseCount : 0,
      promptsByCategory: categoryMap as Record<PromptCategory, number>,
      promptsByModel: modelMap,
      promptsByDay,
      topProjects,
      recentPrompts,
    };
  } catch {
    return defaultStats();
  }
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export async function getPrompts(
  filters?: Partial<FilterState>,
): Promise<{ prompts: Prompt[]; total: number }> {
  try {
    let rows = db.select().from(schema.prompts).all() as Prompt[];

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.promptText?.toLowerCase().includes(q) ||
            r.responsePreview?.toLowerCase().includes(q) ||
            r.category?.toLowerCase().includes(q),
        );
      }
      if (filters.categories && filters.categories.length > 0) {
        rows = rows.filter((r) => r.category && filters.categories!.includes(r.category));
      }
      if (filters.sourceIds && filters.sourceIds.length > 0) {
        rows = rows.filter((r) => r.sourceId && filters.sourceIds!.includes(r.sourceId));
      }
      if (filters.projectIds && filters.projectIds.length > 0) {
        rows = rows.filter((r) => r.projectId && filters.projectIds!.includes(r.projectId));
      }
      if (filters.models && filters.models.length > 0) {
        rows = rows.filter((r) => r.model && filters.models!.includes(r.model));
      }
      if (filters.sessionIds && filters.sessionIds.length > 0) {
        rows = rows.filter((r) => r.sessionId && filters.sessionIds!.includes(r.sessionId));
      }

      const sortBy = filters.sortBy ?? 'timestamp';
      const sortOrder = filters.sortOrder ?? 'desc';
      rows.sort((a, b) => {
        const av = ((a as unknown as Record<string, unknown>)[sortBy] as number | null) ?? 0;
        const bv = ((b as unknown as Record<string, unknown>)[sortBy] as number | null) ?? 0;
        return sortOrder === 'asc' ? av - bv : bv - av;
      });
    } else {
      rows.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    }

    const total = rows.length;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);

    return { prompts: paged, total };
  } catch {
    return { prompts: [], total: 0 };
  }
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  try {
    const row = db.select().from(schema.prompts).where(eq(schema.prompts.id, id)).get();
    return (row as Prompt) ?? null;
  } catch {
    return null;
  }
}

export async function getPromptFiles(promptId: string): Promise<PromptFile[]> {
  try {
    const rows = db
      .select()
      .from(schema.promptFiles)
      .where(eq(schema.promptFiles.promptId, promptId))
      .all();
    return rows as PromptFile[];
  } catch {
    return [];
  }
}

export async function getPromptTags(promptId: string): Promise<string[]> {
  try {
    const rows = db
      .select()
      .from(schema.promptTags)
      .where(eq(schema.promptTags.promptId, promptId))
      .all();
    return rows.map((r) => r.tag);
  } catch {
    return [];
  }
}

export async function getRelatedPrompts(promptId: string, limit = 5): Promise<Prompt[]> {
  try {
    const prompt = await getPromptById(promptId);
    if (!prompt) return [];

    // Find prompts with same category or session
    let rows = db.select().from(schema.prompts).all() as Prompt[];
    rows = rows
      .filter((r) => r.id !== promptId)
      .filter(
        (r) =>
          (prompt.category && r.category === prompt.category) ||
          (prompt.sessionId && r.sessionId === prompt.sessionId),
      )
      .slice(0, limit);

    return rows;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getSessions(): Promise<Session[]> {
  try {
    const rows = db
      .select()
      .from(schema.sessions)
      .orderBy(desc(schema.sessions.startedAt))
      .all();
    return rows as Session[];
  } catch {
    return [];
  }
}

export async function getSessionById(id: string): Promise<Session | null> {
  try {
    const row = db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).get();
    return (row as Session) ?? null;
  } catch {
    return null;
  }
}

export async function getSessionPrompts(sessionId: string): Promise<Prompt[]> {
  try {
    const rows = db
      .select()
      .from(schema.prompts)
      .where(eq(schema.prompts.sessionId, sessionId))
      .orderBy(asc(schema.prompts.timestamp))
      .all();
    return rows as Prompt[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  try {
    const rows = db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.lastSeenAt))
      .all();
    return rows as Project[];
  } catch {
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const row = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
    return (row as Project) ?? null;
  } catch {
    return null;
  }
}

export async function getProjectStats(
  projectId: string,
): Promise<{
  totalPrompts: number;
  sessions: number;
  categories: Record<string, number>;
  topFiles: string[];
}> {
  try {
    const promptRows = db
      .select()
      .from(schema.prompts)
      .where(eq(schema.prompts.projectId, projectId))
      .all();

    const sessionRows = db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.projectId, projectId))
      .all();

    const categories: Record<string, number> = {};
    for (const p of promptRows) {
      if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
    }

    // Gather top files across all prompts in the project
    const promptIds = promptRows.map((p) => p.id);
    let topFiles: string[] = [];
    if (promptIds.length > 0) {
      const fileRows = db
        .select()
        .from(schema.promptFiles)
        .where(inArray(schema.promptFiles.promptId, promptIds))
        .all();
      const fileCount: Record<string, number> = {};
      for (const f of fileRows) {
        fileCount[f.filePath] = (fileCount[f.filePath] || 0) + 1;
      }
      topFiles = Object.entries(fileCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([fp]) => fp);
    }

    return {
      totalPrompts: promptRows.length,
      sessions: sessionRows.length,
      categories,
      topFiles,
    };
  } catch {
    return { totalPrompts: 0, sessions: 0, categories: {}, topFiles: [] };
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function getTemplateCandidates(): Promise<TemplateCandidate[]> {
  try {
    const rows = db
      .select()
      .from(schema.templateCandidates)
      .orderBy(desc(schema.templateCandidates.reuseScore))
      .all();
    return rows as TemplateCandidate[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export async function getSources(): Promise<Source[]> {
  try {
    const rows = db.select().from(schema.sources).all();
    return rows as Source[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Chart data helpers
// ---------------------------------------------------------------------------

export async function getPromptsByDay(
  days = 30,
): Promise<{ date: string; count: number }[]> {
  try {
    const cutoff = Date.now() - days * 86_400_000;
    const rows = db
      .select()
      .from(schema.prompts)
      .all()
      .filter((r) => (r.timestamp ?? 0) >= cutoff);

    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.timestamp) {
        const d = new Date(r.timestamp).toISOString().slice(0, 10);
        map[d] = (map[d] || 0) + 1;
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  } catch {
    return [];
  }
}

export async function getCategoryBreakdown(): Promise<{ category: string; count: number }[]> {
  try {
    const rows = db.select().from(schema.prompts).all();
    const map: Record<string, number> = {};
    for (const r of rows) {
      const cat = r.category ?? 'unknown';
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));
  } catch {
    return [];
  }
}

export async function getSourceBreakdown(): Promise<{ source: string; count: number }[]> {
  try {
    const promptRows = db.select().from(schema.prompts).all();
    const sourceRows = db.select().from(schema.sources).all();
    const sourceNameMap: Record<string, string> = {};
    for (const s of sourceRows) sourceNameMap[s.id] = s.name;

    const map: Record<string, number> = {};
    for (const r of promptRows) {
      const name = r.sourceId ? (sourceNameMap[r.sourceId] ?? r.sourceId) : 'unknown';
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count }));
  } catch {
    return [];
  }
}

export async function getModelBreakdown(): Promise<{ model: string; count: number }[]> {
  try {
    const rows = db.select().from(schema.prompts).all();
    const map: Record<string, number> = {};
    for (const r of rows) {
      const model = r.model ?? 'unknown';
      map[model] = (map[model] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([model, count]) => ({ model, count }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchAll(query: string): Promise<{
  prompts: Prompt[];
  sessions: Session[];
  projects: Project[];
}> {
  try {
    const q = query.toLowerCase();

    const allPrompts = db.select().from(schema.prompts).all() as Prompt[];
    const matchedPrompts = allPrompts
      .filter(
        (p) =>
          p.promptText?.toLowerCase().includes(q) ||
          p.responsePreview?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q),
      )
      .slice(0, 20);

    const allSessions = db.select().from(schema.sessions).all() as Session[];
    const matchedSessions = allSessions
      .filter((s) => s.title?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      .slice(0, 10);

    const allProjects = db.select().from(schema.projects).all() as Project[];
    const matchedProjects = allProjects
      .filter(
        (p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q),
      )
      .slice(0, 10);

    return { prompts: matchedPrompts, sessions: matchedSessions, projects: matchedProjects };
  } catch {
    return { prompts: [], sessions: [], projects: [] };
  }
}
