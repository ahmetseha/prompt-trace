// ---------------------------------------------------------------------------
// Union / Literal Types
// ---------------------------------------------------------------------------

export type PromptCategory =
  | 'bug-fixing'
  | 'refactor'
  | 'architecture'
  | 'code-generation'
  | 'debugging'
  | 'styling'
  | 'testing'
  | 'documentation'
  | 'deployment'
  | 'data-backend'
  | 'performance'
  | 'exploratory'
  | 'review'
  | 'general'
  | 'unknown';

export type PromptIntent =
  | 'ask'
  | 'instruct'
  | 'compare'
  | 'generate'
  | 'fix'
  | 'explain'
  | 'plan'
  | 'transform';

export type SourceType =
  | 'cursor'
  | 'claude-code'
  | 'copilot'
  | 'gemini-cli'
  | 'codex-cli'
  | 'json-import'
  | 'markdown-import';

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

// ---------------------------------------------------------------------------
// Entity Interfaces (matching Drizzle schema)
// ---------------------------------------------------------------------------

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  enabled: number;
  status: string;
  lastScannedAt: number | null;
  metadataJson: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  firstSeenAt: number | null;
  lastSeenAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  sourceId: string | null;
  projectId: string | null;
  externalSessionId: string | null;
  title: string | null;
  startedAt: number | null;
  endedAt: number | null;
  promptCount: number;
  modelSummaryJson: string | null;
  metadataJson: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  sourceId: string | null;
  projectId: string | null;
  sessionId: string | null;
  timestamp: number | null;
  promptText: string | null;
  responsePreview: string | null;
  model: string | null;
  promptLength: number | null;
  category: PromptCategory | null;
  intent: PromptIntent | null;
  tokenEstimate: number | null;
  costEstimate: number | null;
  successScore: number | null;
  reuseScore: number | null;
  metadataJson: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PromptFile {
  id: string;
  promptId: string;
  filePath: string;
  actionType: string | null;
  createdAt: number;
}

export interface PromptTag {
  id: string;
  promptId: string;
  tag: string;
}

export interface TemplateCandidate {
  id: string;
  title: string;
  normalizedPattern: string | null;
  description: string | null;
  sourcePromptIdsJson: string | null;
  reuseScore: number | null;
  category: PromptCategory | null;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Dashboard / UI Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalPrompts: number;
  totalSessions: number;
  totalProjects: number;
  totalSources: number;
  totalTokens: number;
  totalCost: number;
  avgSuccessScore: number;
  avgReuseScore: number;
  promptsByCategory: Record<PromptCategory, number>;
  promptsByModel: Record<string, number>;
  promptsByDay: Array<{ date: string; count: number }>;
  topProjects: Array<{ id: string; name: string; promptCount: number }>;
  recentPrompts: Prompt[];
}

export interface FilterState {
  search: string;
  categories: PromptCategory[];
  intents: PromptIntent[];
  models: string[];
  sourceIds: string[];
  projectIds: string[];
  sessionIds: string[];
  tags: string[];
  timeRange: TimeRange;
  dateFrom: number | null;
  dateTo: number | null;
  minSuccessScore: number | null;
  maxSuccessScore: number | null;
  minReuseScore: number | null;
  maxReuseScore: number | null;
  sortBy: 'timestamp' | 'successScore' | 'reuseScore' | 'tokenEstimate' | 'costEstimate';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
