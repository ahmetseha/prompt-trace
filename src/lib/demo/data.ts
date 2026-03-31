import type {
  Source,
  Project,
  Session,
  Prompt,
  PromptFile,
  PromptTag,
  TemplateCandidate,
  PromptCategory,
  PromptIntent,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Timestamp helpers
// ---------------------------------------------------------------------------
const NOW = Date.now();
const HOUR = 3600_000;
const DAY = 86_400_000;

/** Return a timestamp N days + H hours ago from "now". */
function ago(days: number, hours = 0): number {
  return NOW - days * DAY - hours * HOUR;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
export const demoSources: Source[] = [
  {
    id: 'src-cursor',
    name: 'Cursor',
    type: 'cursor',
    enabled: 1,
    status: 'connected',
    lastScannedAt: ago(0, 2),
    metadataJson: JSON.stringify({ version: '0.45.2' }),
    createdAt: ago(42),
    updatedAt: ago(0, 2),
  },
  {
    id: 'src-claude-code',
    name: 'Claude Code',
    type: 'claude-code',
    enabled: 1,
    status: 'connected',
    lastScannedAt: ago(0, 1),
    metadataJson: JSON.stringify({ version: '1.0.12' }),
    createdAt: ago(40),
    updatedAt: ago(0, 1),
  },
  {
    id: 'src-copilot',
    name: 'Copilot CLI',
    type: 'copilot',
    enabled: 1,
    status: 'connected',
    lastScannedAt: ago(1),
    metadataJson: JSON.stringify({ version: '1.0.5' }),
    createdAt: ago(38),
    updatedAt: ago(1),
  },
  {
    id: 'src-gemini',
    name: 'Gemini CLI',
    type: 'gemini-cli',
    enabled: 1,
    status: 'connected',
    lastScannedAt: ago(0, 6),
    metadataJson: JSON.stringify({ version: '0.3.1' }),
    createdAt: ago(30),
    updatedAt: ago(0, 6),
  },
  {
    id: 'src-codex',
    name: 'Codex CLI',
    type: 'codex-cli',
    enabled: 1,
    status: 'connected',
    lastScannedAt: ago(2),
    metadataJson: JSON.stringify({ version: '0.1.4' }),
    createdAt: ago(25),
    updatedAt: ago(2),
  },
  {
    id: 'src-json',
    name: 'JSON Import',
    type: 'json-import',
    enabled: 1,
    status: 'idle',
    lastScannedAt: ago(5),
    metadataJson: null,
    createdAt: ago(20),
    updatedAt: ago(5),
  },
];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const demoProjects: Project[] = [
  {
    id: 'proj-acme',
    name: 'acme-web-app',
    path: '/Users/dev/projects/acme-web-app',
    firstSeenAt: ago(42),
    lastSeenAt: ago(0, 3),
    createdAt: ago(42),
    updatedAt: ago(0, 3),
  },
  {
    id: 'proj-api',
    name: 'api-gateway',
    path: '/Users/dev/projects/api-gateway',
    firstSeenAt: ago(38),
    lastSeenAt: ago(1),
    createdAt: ago(38),
    updatedAt: ago(1),
  },
  {
    id: 'proj-mobile',
    name: 'mobile-dashboard',
    path: '/Users/dev/projects/mobile-dashboard',
    firstSeenAt: ago(35),
    lastSeenAt: ago(0, 5),
    createdAt: ago(35),
    updatedAt: ago(0, 5),
  },
  {
    id: 'proj-design',
    name: 'design-system',
    path: '/Users/dev/projects/design-system',
    firstSeenAt: ago(28),
    lastSeenAt: ago(2),
    createdAt: ago(28),
    updatedAt: ago(2),
  },
  {
    id: 'proj-data',
    name: 'data-pipeline',
    path: '/Users/dev/projects/data-pipeline',
    firstSeenAt: ago(20),
    lastSeenAt: ago(0, 8),
    createdAt: ago(20),
    updatedAt: ago(0, 8),
  },
];

// ---------------------------------------------------------------------------
// Sessions  (17 sessions across projects and sources)
// ---------------------------------------------------------------------------
export const demoSessions: Session[] = [
  {
    id: 'sess-001',
    sourceId: 'src-cursor',
    projectId: 'proj-acme',
    externalSessionId: 'cur-ab12cd',
    title: 'Auth refactor session',
    startedAt: ago(40),
    endedAt: ago(40, -2),
    promptCount: 7,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 4, 'claude-3.5-sonnet': 3 }),
    metadataJson: null,
    createdAt: ago(40),
    updatedAt: ago(40, -2),
  },
  {
    id: 'sess-002',
    sourceId: 'src-claude-code',
    projectId: 'proj-acme',
    externalSessionId: 'cc-ef34gh',
    title: 'API pagination debugging',
    startedAt: ago(37),
    endedAt: ago(36, -5),
    promptCount: 7,
    modelSummaryJson: JSON.stringify({ 'claude-3.5-sonnet': 7 }),
    metadataJson: null,
    createdAt: ago(37),
    updatedAt: ago(36, -5),
  },
  {
    id: 'sess-003',
    sourceId: 'src-cursor',
    projectId: 'proj-mobile',
    externalSessionId: 'cur-ij56kl',
    title: 'Dashboard performance optimization',
    startedAt: ago(34),
    endedAt: ago(33, -2),
    promptCount: 7,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 4, 'claude-3.5-sonnet': 3 }),
    metadataJson: null,
    createdAt: ago(34),
    updatedAt: ago(33, -2),
  },
  {
    id: 'sess-004',
    sourceId: 'src-copilot',
    projectId: 'proj-api',
    externalSessionId: 'cop-mn78op',
    title: 'GraphQL migration planning',
    startedAt: ago(30),
    endedAt: ago(30, -2),
    promptCount: 5,
    modelSummaryJson: JSON.stringify({ 'gpt-4': 5 }),
    metadataJson: null,
    createdAt: ago(30),
    updatedAt: ago(30, -2),
  },
  {
    id: 'sess-005',
    sourceId: 'src-claude-code',
    projectId: 'proj-design',
    externalSessionId: 'cc-qr90st',
    title: 'Component library setup',
    startedAt: ago(28),
    endedAt: ago(27, -4),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'claude-3-opus': 2, 'claude-3.5-sonnet': 4 }),
    metadataJson: null,
    createdAt: ago(28),
    updatedAt: ago(27, -4),
  },
  {
    id: 'sess-006',
    sourceId: 'src-gemini',
    projectId: 'proj-data',
    externalSessionId: 'gem-uv12wx',
    title: 'ETL pipeline architecture',
    startedAt: ago(25),
    endedAt: ago(24, -4),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'gemini-pro': 6 }),
    metadataJson: null,
    createdAt: ago(25),
    updatedAt: ago(24, -4),
  },
  {
    id: 'sess-007',
    sourceId: 'src-cursor',
    projectId: 'proj-acme',
    externalSessionId: 'cur-yz34ab',
    title: 'Testing suite improvements',
    startedAt: ago(22),
    endedAt: ago(22, -3),
    promptCount: 5,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 3, 'claude-3.5-sonnet': 2 }),
    metadataJson: null,
    createdAt: ago(22),
    updatedAt: ago(22, -3),
  },
  {
    id: 'sess-008',
    sourceId: 'src-codex',
    projectId: 'proj-api',
    externalSessionId: 'cdx-cd56ef',
    title: 'Database connection pooling fix',
    startedAt: ago(18),
    endedAt: ago(17, -3),
    promptCount: 5,
    modelSummaryJson: JSON.stringify({ 'codex-mini': 5 }),
    metadataJson: null,
    createdAt: ago(18),
    updatedAt: ago(17, -3),
  },
  {
    id: 'sess-009',
    sourceId: 'src-claude-code',
    projectId: 'proj-mobile',
    externalSessionId: 'cc-gh78ij',
    title: 'React Native navigation overhaul',
    startedAt: ago(15),
    endedAt: ago(15, -4),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'claude-3.5-sonnet': 4, 'claude-3-opus': 2 }),
    metadataJson: null,
    createdAt: ago(15),
    updatedAt: ago(15, -4),
  },
  {
    id: 'sess-010',
    sourceId: 'src-cursor',
    projectId: 'proj-design',
    externalSessionId: 'cur-kl90mn',
    title: 'Dark mode implementation',
    startedAt: ago(12),
    endedAt: ago(11, -3),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 6 }),
    metadataJson: null,
    createdAt: ago(12),
    updatedAt: ago(11, -3),
  },
  {
    id: 'sess-011',
    sourceId: 'src-gemini',
    projectId: 'proj-data',
    externalSessionId: 'gem-op12qr',
    title: 'Streaming data processor',
    startedAt: ago(10),
    endedAt: ago(9, -1),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'gemini-pro': 6 }),
    metadataJson: null,
    createdAt: ago(10),
    updatedAt: ago(9, -1),
  },
  {
    id: 'sess-012',
    sourceId: 'src-claude-code',
    projectId: 'proj-acme',
    externalSessionId: 'cc-st34uv',
    title: 'E2E test coverage push',
    startedAt: ago(7),
    endedAt: ago(6, -5),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'claude-3.5-sonnet': 6 }),
    metadataJson: null,
    createdAt: ago(7),
    updatedAt: ago(6, -5),
  },
  {
    id: 'sess-013',
    sourceId: 'src-cursor',
    projectId: 'proj-api',
    externalSessionId: 'cur-wx56yz',
    title: 'Rate limiting and caching',
    startedAt: ago(5),
    endedAt: ago(4, -5),
    promptCount: 6,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 4, 'claude-3.5-sonnet': 2 }),
    metadataJson: null,
    createdAt: ago(5),
    updatedAt: ago(4, -5),
  },
  {
    id: 'sess-014',
    sourceId: 'src-codex',
    projectId: 'proj-data',
    externalSessionId: 'cdx-ab78cd',
    title: 'Schema migration scripts',
    startedAt: ago(3),
    endedAt: ago(3, -1),
    promptCount: 4,
    modelSummaryJson: JSON.stringify({ 'codex-mini': 4 }),
    metadataJson: null,
    createdAt: ago(3),
    updatedAt: ago(3, -1),
  },
  {
    id: 'sess-015',
    sourceId: 'src-claude-code',
    projectId: 'proj-mobile',
    externalSessionId: 'cc-ef90gh',
    title: 'Push notification integration',
    startedAt: ago(1),
    endedAt: ago(1, -2),
    promptCount: 5,
    modelSummaryJson: JSON.stringify({ 'claude-3.5-sonnet': 3, 'claude-3-opus': 2 }),
    metadataJson: null,
    createdAt: ago(1),
    updatedAt: ago(1, -2),
  },
  {
    id: 'sess-016',
    sourceId: 'src-cursor',
    projectId: 'proj-acme',
    externalSessionId: 'cur-ij12kl',
    title: 'Deployment pipeline fixes',
    startedAt: ago(0, 12),
    endedAt: ago(0, 8),
    promptCount: 4,
    modelSummaryJson: JSON.stringify({ 'gpt-4o': 2, 'claude-3.5-sonnet': 2 }),
    metadataJson: null,
    createdAt: ago(0, 12),
    updatedAt: ago(0, 8),
  },
  {
    id: 'sess-017',
    sourceId: 'src-json',
    projectId: 'proj-acme',
    externalSessionId: null,
    title: 'Imported: legacy prompt history',
    startedAt: ago(35),
    endedAt: ago(32),
    promptCount: 3,
    modelSummaryJson: JSON.stringify({ 'gpt-4': 3 }),
    metadataJson: JSON.stringify({ importedFrom: 'chatgpt-export.json' }),
    createdAt: ago(20),
    updatedAt: ago(20),
  },
];

// ---------------------------------------------------------------------------
// Prompts  (95 realistic developer prompts)
// ---------------------------------------------------------------------------

interface PromptSeed {
  id: string;
  sourceId: string;
  projectId: string;
  sessionId: string;
  dayOffset: number;
  hourOffset: number;
  promptText: string;
  responsePreview: string;
  model: string;
  category: PromptCategory;
  intent: PromptIntent;
  successScore: number;
  reuseScore: number;
}

const promptSeeds: PromptSeed[] = [
  // ---- Session 001: Auth refactor (acme, cursor) ----
  { id: 'prompt-001', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 0, promptText: 'Refactor the authentication middleware to use JWT tokens instead of session cookies. We need to support both access and refresh tokens with proper expiration handling.', responsePreview: "I'll help you refactor the auth middleware to JWT. Here's the plan: First, we'll create a TokenService class that handles JWT signing and verification. Then we'll update the middleware to extract the Bearer token from the Authorization header...", model: 'gpt-4o', category: 'refactor', intent: 'instruct', successScore: 0.92, reuseScore: 0.78 },
  { id: 'prompt-002', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 0.5, promptText: "The refresh token rotation isn't working. When I call /auth/refresh, it returns the same token instead of generating a new one. Here's the current code in auth.controller.ts", responsePreview: "The issue is in your refreshToken method. You're reusing the same payload without updating the `iat` (issued at) claim. The JWT library sees the same payload and returns an identical token. Here's the fix...", model: 'gpt-4o', category: 'bug-fixing', intent: 'fix', successScore: 0.95, reuseScore: 0.45 },
  { id: 'prompt-003', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 1, promptText: "Add proper TypeScript types for the JWT payload. Currently we have `any` everywhere and it's causing issues with the user object in request handlers.", responsePreview: "Let's define proper interfaces for the JWT payload and extend the Express Request type. First, create a `types/auth.ts` file:\n\n```typescript\nexport interface JwtPayload {\n  sub: string;\n  email: string;\n  role: UserRole;\n  iat: number;\n  exp: number;\n}...", model: 'claude-3.5-sonnet', category: 'refactor', intent: 'instruct', successScore: 0.88, reuseScore: 0.82 },
  { id: 'prompt-004', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 1.3, promptText: 'Write unit tests for the TokenService class. Cover edge cases: expired tokens, malformed tokens, missing claims, and token blacklisting.', responsePreview: "Here are comprehensive tests for TokenService using Jest:\n\n```typescript\ndescribe('TokenService', () => {\n  let tokenService: TokenService;\n  const mockUser = { id: 'user-1', email: 'test@example.com', role: 'admin' };\n\n  beforeEach(() => {\n    tokenService = new TokenService(mockConfig);...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'generate', successScore: 0.90, reuseScore: 0.70 },
  { id: 'prompt-005', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 1.5, promptText: 'How should we handle token revocation? Redis vs database blacklist - what are the tradeoffs for our scale (~10k DAU)?', responsePreview: "For 10k DAU, both approaches work well, but they have different tradeoffs:\n\n**Redis blacklist:**\n- Pros: O(1) lookup, automatic TTL expiration, minimal storage overhead\n- Cons: additional infrastructure dependency, data loss on restart without persistence...", model: 'claude-3.5-sonnet', category: 'architecture', intent: 'compare', successScore: 0.85, reuseScore: 0.60 },
  { id: 'prompt-006', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 1.8, promptText: 'Implement the Redis token blacklist with a TTL matching the token expiration time', responsePreview: "Here's the Redis-based token blacklist implementation:\n\n```typescript\nimport Redis from 'ioredis';\n\nexport class TokenBlacklist {\n  private redis: Redis;\n  private prefix = 'bl:';\n\n  constructor(redisUrl: string) {\n    this.redis = new Redis(redisUrl);\n  }\n\n  async add(jti: string, expiresIn: number)...", model: 'gpt-4o', category: 'code-generation', intent: 'generate', successScore: 0.91, reuseScore: 0.72 },
  { id: 'prompt-007', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-001', dayOffset: 40, hourOffset: 2, promptText: 'Update the logout endpoint to blacklist the current token and clear the refresh token from the database', responsePreview: "I'll update the logout controller and add the blacklist call:\n\n```typescript\nasync logout(req: AuthenticatedRequest, res: Response) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'No token' });\n\n  const decoded = this.tokenService.decode(token)...", model: 'gpt-4o', category: 'code-generation', intent: 'instruct', successScore: 0.87, reuseScore: 0.55 },

  // ---- Session 002: API pagination (acme, claude-code) ----
  { id: 'prompt-008', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 0, promptText: 'The /api/products endpoint returns all 50k products at once and the page takes 8 seconds to load. Add cursor-based pagination with a default page size of 25.', responsePreview: "Cursor-based pagination is the right choice for large datasets. Here's the implementation plan:\n\n1. Add a `cursor` query parameter that accepts the last item's ID\n2. Use `WHERE id > cursor ORDER BY id LIMIT pageSize + 1` to check if there's a next page...", model: 'claude-3.5-sonnet', category: 'performance', intent: 'instruct', successScore: 0.94, reuseScore: 0.85 },
  { id: 'prompt-009', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 0.5, promptText: "The cursor pagination breaks when products are sorted by price instead of ID. The cursor needs to work with arbitrary sort fields.", responsePreview: "When sorting by non-unique fields like price, you need a compound cursor that includes both the sort field and a tiebreaker (usually the ID). Here's how to implement it:\n\n```typescript\ninterface PaginationCursor {\n  sortValue: number | string;\n  id: string;\n}...", model: 'claude-3.5-sonnet', category: 'bug-fixing', intent: 'fix', successScore: 0.89, reuseScore: 0.80 },
  { id: 'prompt-010', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 1, promptText: 'Add proper response envelope for paginated endpoints with totalCount, hasNextPage, nextCursor fields. Make it generic so all list endpoints can use it.', responsePreview: "Here's a generic paginated response type and helper:\n\n```typescript\nexport interface PaginatedResponse<T> {\n  data: T[];\n  pagination: {\n    totalCount: number;\n    hasNextPage: boolean;\n    nextCursor: string | null;\n    pageSize: number;\n  };\n}...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.93, reuseScore: 0.90 },
  { id: 'prompt-011', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 1.5, promptText: 'Write integration tests for the paginated products endpoint. Test first page, middle page, last page, empty results, and invalid cursor scenarios.', responsePreview: "Here are integration tests using supertest:\n\n```typescript\ndescribe('GET /api/products (paginated)', () => {\n  beforeAll(async () => {\n    await seedProducts(100);\n  });\n\n  it('returns first page with default page size', async () => {\n    const res = await request(app).get('/api/products');\n    expect(res.status).toBe(200)...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'generate', successScore: 0.91, reuseScore: 0.75 },
  { id: 'prompt-012', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 2, promptText: "Optimize the totalCount query - it's doing a full table scan. Can we cache it or use an approximate count?", responsePreview: "For large tables, exact COUNT(*) is expensive. Here are three approaches ordered by complexity:\n\n1. **Cached count**: Store the count in Redis with a 60s TTL. Invalidate on insert/delete.\n2. **Approximate count**: Use `pg_class.reltuples` for PostgreSQL...", model: 'claude-3.5-sonnet', category: 'performance', intent: 'compare', successScore: 0.86, reuseScore: 0.68 },
  { id: 'prompt-013', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 37, hourOffset: 3, promptText: 'Add rate limiting to the products API. 100 requests per minute per API key, with proper 429 response headers.', responsePreview: "I'll implement rate limiting using a sliding window counter in Redis:\n\n```typescript\nimport rateLimit from 'express-rate-limit';\nimport RedisStore from 'rate-limit-redis';\n\nexport const apiRateLimit = rateLimit({\n  store: new RedisStore({ client: redis }),\n  windowMs: 60 * 1000,\n  max: 100...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'instruct', successScore: 0.90, reuseScore: 0.82 },
  { id: 'prompt-086', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-002', dayOffset: 36, hourOffset: 5, promptText: 'Create a reusable form validation hook that supports async validators for checking email uniqueness against the API.', responsePreview: "Here's a flexible useFormValidation hook with async support:\n\n```typescript\nimport { useState, useCallback, useRef } from 'react';\n\ntype Validator<T> = (value: T) => string | null | Promise<string | null>;\n\ninterface FieldConfig<T> {\n  initialValue: T;\n  validators: Validator<T>[];\n}...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.91, reuseScore: 0.92 },

  // ---- Session 003: Dashboard perf (mobile, cursor) ----
  { id: 'prompt-014', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 0, promptText: 'Why is the useEffect in Dashboard.tsx causing an infinite re-render loop? The component keeps fetching data even though the dependencies array looks correct.', responsePreview: "The infinite loop is caused by the `filters` object being recreated on every render. Even though the values inside are the same, JavaScript object reference equality fails. You have:\n\n```tsx\nuseEffect(() => {\n  fetchData(filters);\n}, [filters]); // filters is a new obj...", model: 'gpt-4o', category: 'debugging', intent: 'fix', successScore: 0.96, reuseScore: 0.55 },
  { id: 'prompt-015', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 0.5, promptText: 'The dashboard chart renders are slow. Profile shows the BarChart component re-renders 47 times when switching tabs. How do I memoize this properly?', responsePreview: "47 re-renders is excessive. The issue is likely that the chart data array is being recreated on every parent render. Here's how to fix it:\n\n1. Memoize the data transformation:\n```tsx\nconst chartData = useMemo(() => {\n  return rawData.map(item => ({\n    label: item.name,...", model: 'gpt-4o', category: 'performance', intent: 'fix', successScore: 0.88, reuseScore: 0.72 },
  { id: 'prompt-016', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 1, promptText: 'Create a reusable useDebounce hook for search input in the dashboard. It should cancel pending debounces on unmount.', responsePreview: "Here's a clean useDebounce hook with cleanup:\n\n```typescript\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebouncedValue(value)...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.93, reuseScore: 0.95 },
  { id: 'prompt-017', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 2, promptText: 'Implement virtual scrolling for the activity feed list. It has 2000+ items and scrolling is janky on mobile.', responsePreview: "For React Native, I recommend using @shopify/flash-list instead of FlatList - it's significantly faster for large lists. Here's how to migrate:\n\n```tsx\nimport { FlashList } from '@shopify/flash-list';\n\n<FlashList\n  data={activities}\n  renderItem={renderActivity}\n  estimatedItemSize={72}...", model: 'claude-3.5-sonnet', category: 'performance', intent: 'instruct', successScore: 0.85, reuseScore: 0.78 },
  { id: 'prompt-018', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 3, promptText: 'Add pull-to-refresh and infinite scroll to the activity feed', responsePreview: "Here's how to add both pull-to-refresh and infinite scroll to the FlashList:\n\n```tsx\nconst [refreshing, setRefreshing] = useState(false);\nconst [loadingMore, setLoadingMore] = useState(false);\n\nconst onRefresh = useCallback(async () => {\n  setRefreshing(true);\n  await fetchActivities({ reset: true })...", model: 'gpt-4o', category: 'code-generation', intent: 'generate', successScore: 0.87, reuseScore: 0.80 },
  { id: 'prompt-019', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 34, hourOffset: 4, promptText: 'Explain the difference between useMemo and useCallback - I keep mixing them up', responsePreview: "**useMemo** memoizes a computed **value**, while **useCallback** memoizes a **function reference**.\n\n```tsx\n// useMemo: caches the RESULT of calling the function\nconst sortedItems = useMemo(() => items.sort(compareFn), [items]);\n\n// useCallback: caches the FUNCTION ITSELF...", model: 'gpt-4o', category: 'exploratory', intent: 'explain', successScore: 0.92, reuseScore: 0.40 },
  { id: 'prompt-087', sourceId: 'src-cursor', projectId: 'proj-mobile', sessionId: 'sess-003', dayOffset: 33, hourOffset: 2, promptText: 'Add skeleton loading states for the dashboard cards. They should pulse and match the layout of the actual content.', responsePreview: "Here's a Skeleton component with pulse animation:\n\n```tsx\nimport { View, Animated, StyleSheet, ViewStyle } from 'react-native';\nimport { useEffect, useRef } from 'react';\n\ninterface SkeletonProps {\n  width: number | string;\n  height: number;\n  borderRadius?: number;\n  style?: ViewStyle;\n}...", model: 'claude-3.5-sonnet', category: 'styling', intent: 'generate', successScore: 0.86, reuseScore: 0.80 },

  // ---- Session 004: GraphQL migration (api, copilot) ----
  { id: 'prompt-020', sourceId: 'src-copilot', projectId: 'proj-api', sessionId: 'sess-004', dayOffset: 30, hourOffset: 0, promptText: "Convert the /api/users REST endpoint to GraphQL. Keep the existing REST endpoint working during migration. We're using Apollo Server.", responsePreview: "Here's a migration strategy that keeps both REST and GraphQL running in parallel:\n\n1. First, define the GraphQL schema:\n```graphql\ntype User {\n  id: ID!\n  email: String!\n  name: String!\n  role: UserRole!\n  createdAt: DateTime!\n  orders: [Order!]!\n}\n\nenum UserRole {...", model: 'gpt-4', category: 'refactor', intent: 'instruct', successScore: 0.88, reuseScore: 0.75 },
  { id: 'prompt-021', sourceId: 'src-copilot', projectId: 'proj-api', sessionId: 'sess-004', dayOffset: 30, hourOffset: 0.5, promptText: 'The GraphQL resolver for users.orders is doing N+1 queries. Set up DataLoader for batch loading.', responsePreview: "N+1 is the classic GraphQL problem. DataLoader solves it by batching individual loads within a single tick:\n\n```typescript\nimport DataLoader from 'dataloader';\n\nconst orderLoader = new DataLoader<string, Order[]>(async (userIds) => {\n  const orders = await db.order.findMany({\n    where: { userId: { in: [...userIds] } }...", model: 'gpt-4', category: 'performance', intent: 'fix', successScore: 0.93, reuseScore: 0.85 },
  { id: 'prompt-022', sourceId: 'src-copilot', projectId: 'proj-api', sessionId: 'sess-004', dayOffset: 30, hourOffset: 1, promptText: 'Add proper error handling to the GraphQL resolvers. Map our custom AppError types to GraphQL errors with proper codes.', responsePreview: "Here's how to map your AppError hierarchy to GraphQL errors using Apollo's error handling:\n\n```typescript\nimport { GraphQLError } from 'graphql';\n\nfunction mapErrorToGraphQL(error: AppError): GraphQLError {\n  const extensions: Record<string, unknown> = {\n    code: error.code,...", model: 'gpt-4', category: 'code-generation', intent: 'instruct', successScore: 0.86, reuseScore: 0.70 },
  { id: 'prompt-023', sourceId: 'src-copilot', projectId: 'proj-api', sessionId: 'sess-004', dayOffset: 30, hourOffset: 1.5, promptText: 'Set up GraphQL code generation from the schema to auto-generate TypeScript types for resolvers', responsePreview: "I'll set up @graphql-codegen with the typescript and typescript-resolvers plugins:\n\n```yaml\n# codegen.yml\nschema: './src/schema/**/*.graphql'\ngenerates:\n  ./src/generated/graphql.ts:\n    plugins:\n      - typescript\n      - typescript-resolvers\n    config:\n      useIndexSignature: true...", model: 'gpt-4', category: 'deployment', intent: 'instruct', successScore: 0.90, reuseScore: 0.72 },
  { id: 'prompt-024', sourceId: 'src-copilot', projectId: 'proj-api', sessionId: 'sess-004', dayOffset: 30, hourOffset: 2, promptText: 'Write a mutation for creating users with input validation. Email must be unique, password must be at least 8 chars with one number.', responsePreview: "Here's the mutation with Zod validation:\n\n```graphql\ninput CreateUserInput {\n  email: String!\n  password: String!\n  name: String!\n}\n\ntype Mutation {\n  createUser(input: CreateUserInput!): User!\n}\n```\n\n```typescript\nconst CreateUserSchema = z.object({\n  email: z.string().email(),\n  password: z.string().min(8).regex(/\\d/)...", model: 'gpt-4', category: 'code-generation', intent: 'generate', successScore: 0.91, reuseScore: 0.78 },

  // ---- Session 005: Component library (design, claude-code) ----
  { id: 'prompt-025', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 28, hourOffset: 0, promptText: 'Set up a React component library with Storybook, Tailwind CSS, and proper TypeScript support. Should export ESM and CJS builds.', responsePreview: "I'll set up the library with tsup for building and Storybook 7 for documentation:\n\n```bash\nnpm init -y\nnpm install react react-dom typescript tailwindcss\nnpm install -D tsup @storybook/react-vite storybook\n```\n\nProject structure:\n```\nsrc/\n  components/\n    Button/...", model: 'claude-3-opus', category: 'architecture', intent: 'instruct', successScore: 0.87, reuseScore: 0.65 },
  { id: 'prompt-026', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 28, hourOffset: 1, promptText: 'Create a Button component with variants: primary, secondary, ghost, destructive. Sizes: sm, md, lg. Should support asChild pattern like Radix.', responsePreview: "Here's a flexible Button component using cva (class-variance-authority) for variant management and the Slot pattern for asChild:\n\n```tsx\nimport { cva, type VariantProps } from 'class-variance-authority';\nimport { Slot } from '@radix-ui/react-slot';\nimport { forwardRef } from 'react'...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.94, reuseScore: 0.92 },
  { id: 'prompt-027', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 28, hourOffset: 1.5, promptText: 'Create an accessible Dialog/Modal component using Radix UI Dialog primitives. Needs to support controlled and uncontrolled modes.', responsePreview: "Here's the Dialog component built on Radix UI primitives with full accessibility:\n\n```tsx\nimport * as DialogPrimitive from '@radix-ui/react-dialog';\nimport { X } from 'lucide-react';\nimport { cn } from '@/lib/utils';\n\nconst Dialog = DialogPrimitive.Root;\nconst DialogTrigger = DialogPrimitive.Trigger...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.91, reuseScore: 0.88 },
  { id: 'prompt-028', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 28, hourOffset: 2, promptText: 'Write Storybook stories for the Button component showing all variant and size combinations. Include an interactive playground story.', responsePreview: "Here are comprehensive Storybook stories:\n\n```tsx\nimport type { Meta, StoryObj } from '@storybook/react';\nimport { Button } from './Button';\n\nconst meta: Meta<typeof Button> = {\n  title: 'Components/Button',\n  component: Button,\n  argTypes: {\n    variant: {\n      control: 'select',\n      options: ['primary'...", model: 'claude-3-opus', category: 'documentation', intent: 'generate', successScore: 0.89, reuseScore: 0.70 },
  { id: 'prompt-029', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 28, hourOffset: 3, promptText: 'Set up design tokens as CSS custom properties. Need a system for colors (with dark mode), spacing, typography, and border radius.', responsePreview: "Here's a design token system using CSS custom properties with HSL colors for easy theme manipulation:\n\n```css\n:root {\n  /* Colors - using HSL for easy manipulation */\n  --color-primary-h: 222;\n  --color-primary-s: 47%;\n  --color-primary-l: 51%;\n  --color-primary: hsl(var(--color-primary-h) var(--color-primary-s)...", model: 'claude-3.5-sonnet', category: 'styling', intent: 'instruct', successScore: 0.86, reuseScore: 0.82 },
  { id: 'prompt-093', sourceId: 'src-claude-code', projectId: 'proj-design', sessionId: 'sess-005', dayOffset: 27, hourOffset: 4, promptText: 'Create an Input component with label, error message, helper text, and support for left/right icons. Must be accessible with proper aria attributes.', responsePreview: "Here's a fully accessible Input component:\n\n```tsx\nimport { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> {\n  label: string;\n  error?: string;\n  helperText?: string;\n  leftIcon?: ReactNode...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.92, reuseScore: 0.90 },

  // ---- Session 006: ETL pipeline (data, gemini) ----
  { id: 'prompt-030', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 25, hourOffset: 0, promptText: 'Design a data pipeline architecture for ingesting CSV files from S3, transforming them, and loading into PostgreSQL. Expected volume: 50GB/day across 200 files.', responsePreview: "For 50GB/day with 200 files, I recommend a staged pipeline architecture:\n\n**Stage 1 - Ingestion**: S3 event notifications trigger Lambda functions that validate file format and register the job in a metadata table.\n\n**Stage 2 - Processing**: Use AWS Glue...", model: 'gemini-pro', category: 'architecture', intent: 'plan', successScore: 0.84, reuseScore: 0.60 },
  { id: 'prompt-031', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 25, hourOffset: 0.5, promptText: 'Write a Python script that validates CSV schemas before processing. Should check column names, data types, and required fields against a schema definition.', responsePreview: "Here's a CSV validator using pydantic for schema definition:\n\n```python\nfrom pydantic import BaseModel, validator\nimport pandas as pd\nfrom typing import Dict, List, Optional\nimport logging\n\nclass ColumnSchema(BaseModel):\n    name: str\n    dtype: str  # 'int', 'float', 'str', 'datetime'\n    required: bool = True...", model: 'gemini-pro', category: 'code-generation', intent: 'generate', successScore: 0.88, reuseScore: 0.75 },
  { id: 'prompt-032', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 25, hourOffset: 1, promptText: 'How do I handle duplicate records in the pipeline? Some source files overlap and we need idempotent inserts.', responsePreview: "There are several strategies for idempotent inserts:\n\n1. **UPSERT (recommended for your case)**: Use PostgreSQL's `ON CONFLICT` clause:\n```sql\nINSERT INTO records (id, data, updated_at)\nVALUES ($1, $2, NOW())\nON CONFLICT (id) DO UPDATE SET\n  data = EXCLUDED.data...", model: 'gemini-pro', category: 'data-backend', intent: 'ask', successScore: 0.90, reuseScore: 0.70 },
  { id: 'prompt-033', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 25, hourOffset: 1.5, promptText: 'Create a monitoring dashboard query that shows pipeline health: jobs running, failed, succeeded in the last 24h, average processing time, and data volume.', responsePreview: "Here's a SQL query that produces a pipeline health summary:\n\n```sql\nWITH job_stats AS (\n  SELECT\n    status,\n    COUNT(*) as count,\n    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_secs,\n    SUM(bytes_processed) as total_bytes\n  FROM pipeline_jobs...", model: 'gemini-pro', category: 'data-backend', intent: 'generate', successScore: 0.85, reuseScore: 0.65 },
  { id: 'prompt-034', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 25, hourOffset: 2, promptText: 'Set up dead letter queue for failed pipeline jobs. Failed records should be stored with error details for manual review.', responsePreview: "Here's a DLQ implementation using SQS and a PostgreSQL error table:\n\n```python\nimport boto3\nimport json\nfrom datetime import datetime\n\nclass DeadLetterQueue:\n    def __init__(self, queue_url: str, db_conn):\n        self.sqs = boto3.client('sqs')\n        self.queue_url = queue_url\n        self.db = db_conn...", model: 'gemini-pro', category: 'code-generation', intent: 'instruct', successScore: 0.82, reuseScore: 0.68 },
  { id: 'prompt-094', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-006', dayOffset: 24, hourOffset: 4, promptText: 'Write a data quality check that runs after each ETL job. Validate row counts, null percentages, and value distributions against expected ranges.', responsePreview: "Here's a data quality validation framework:\n\n```python\nfrom dataclasses import dataclass\nfrom typing import Dict, List, Optional\nimport pandas as pd\n\n@dataclass\nclass QualityCheck:\n    name: str\n    passed: bool\n    expected: str\n    actual: str\n    severity: str  # 'critical', 'warning', 'info'...", model: 'gemini-pro', category: 'testing', intent: 'generate', successScore: 0.88, reuseScore: 0.75 },

  // ---- Session 007: Testing (acme, cursor) ----
  { id: 'prompt-035', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-007', dayOffset: 22, hourOffset: 0, promptText: 'Write unit tests for the UserService class covering edge cases for email validation, duplicate detection, and password strength requirements.', responsePreview: "Here are thorough unit tests for UserService:\n\n```typescript\ndescribe('UserService', () => {\n  let userService: UserService;\n  let mockRepo: jest.Mocked<UserRepository>;\n\n  beforeEach(() => {\n    mockRepo = createMockRepo();\n    userService = new UserService(mockRepo);\n  });\n\n  describe('email validation'...", model: 'gpt-4o', category: 'testing', intent: 'generate', successScore: 0.92, reuseScore: 0.80 },
  { id: 'prompt-036', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-007', dayOffset: 22, hourOffset: 0.5, promptText: 'Create a test helper that sets up an in-memory SQLite database with the schema and seed data for integration tests', responsePreview: "Here's a reusable test database helper:\n\n```typescript\nimport Database from 'better-sqlite3';\nimport { drizzle } from 'drizzle-orm/better-sqlite3';\nimport * as schema from '../db/schema';\nimport { migrate } from 'drizzle-orm/better-sqlite3/migrator';\n\nexport function createTestDb() {\n  const sqlite = new Database(':memory:')...", model: 'gpt-4o', category: 'testing', intent: 'generate', successScore: 0.88, reuseScore: 0.85 },
  { id: 'prompt-037', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-007', dayOffset: 22, hourOffset: 1, promptText: 'Our test suite takes 4 minutes to run. Profile it and suggest how to speed it up. We have 340 tests.', responsePreview: "Let me help you diagnose the slow tests. Run with timing:\n\n```bash\njest --verbose --logHeapUsage 2>&1 | tee test-timing.log\n```\n\nCommon causes for slow test suites:\n\n1. **Heavy setup/teardown**: If each test file spins up a database or server, that adds up. Use `beforeAll`...", model: 'claude-3.5-sonnet', category: 'performance', intent: 'fix', successScore: 0.80, reuseScore: 0.55 },
  { id: 'prompt-038', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-007', dayOffset: 22, hourOffset: 2, promptText: 'Set up GitHub Actions CI/CD pipeline with test, lint, type-check, and deploy stages. Deploy to Vercel on main branch merges.', responsePreview: "Here's a comprehensive GitHub Actions workflow:\n\n```yaml\nname: CI/CD\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'...", model: 'claude-3.5-sonnet', category: 'deployment', intent: 'generate', successScore: 0.91, reuseScore: 0.88 },
  { id: 'prompt-039', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-007', dayOffset: 22, hourOffset: 3, promptText: 'Add test coverage reporting to the CI pipeline. Fail the build if coverage drops below 80%.', responsePreview: "Add coverage configuration to jest.config.ts and the CI workflow:\n\n```typescript\n// jest.config.ts\nexport default {\n  collectCoverage: true,\n  coverageDirectory: 'coverage',\n  coverageReporters: ['text', 'lcov', 'json-summary'],\n  coverageThreshold: {\n    global: {\n      branches: 80,\n      functions: 80...", model: 'gpt-4o', category: 'deployment', intent: 'instruct', successScore: 0.87, reuseScore: 0.75 },

  // ---- Session 008: DB connection pooling (api, codex) ----
  { id: 'prompt-040', sourceId: 'src-codex', projectId: 'proj-api', sessionId: 'sess-008', dayOffset: 18, hourOffset: 0, promptText: 'Help me debug why the database connection pool is exhausting under load. We\'re using pg-pool with max 20 connections and seeing "too many clients" errors at 500 RPS.', responsePreview: "Connection pool exhaustion at 500 RPS with 20 connections suggests your queries are holding connections too long. Let's diagnose:\n\n1. **Check query duration**: Add logging to measure how long each query takes:\n```typescript\nconst start = Date.now();\nconst result = await pool.query(sql)...", model: 'codex-mini', category: 'debugging', intent: 'fix', successScore: 0.91, reuseScore: 0.60 },
  { id: 'prompt-041', sourceId: 'src-codex', projectId: 'proj-api', sessionId: 'sess-008', dayOffset: 18, hourOffset: 0.3, promptText: "Found the issue - some queries aren't releasing connections back to the pool because of unhandled promise rejections. Add proper connection management.", responsePreview: "The key issue is ensuring connections are always returned to the pool, even on errors. Here's a wrapper:\n\n```typescript\nexport async function withConnection<T>(\n  pool: Pool,\n  fn: (client: PoolClient) => Promise<T>\n): Promise<T> {\n  const client = await pool.connect();\n  try {\n    return await fn(client)...", model: 'codex-mini', category: 'bug-fixing', intent: 'fix', successScore: 0.94, reuseScore: 0.72 },
  { id: 'prompt-042', sourceId: 'src-codex', projectId: 'proj-api', sessionId: 'sess-008', dayOffset: 18, hourOffset: 0.7, promptText: 'Set up PgBouncer as a connection pooler between our app and PostgreSQL. Docker compose config.', responsePreview: "Here's a Docker Compose setup with PgBouncer:\n\n```yaml\nversion: '3.8'\n\nservices:\n  pgbouncer:\n    image: edoburu/pgbouncer:1.21.0\n    environment:\n      DATABASE_URL: postgres://app:password@postgres:5432/mydb\n      POOL_MODE: transaction\n      MAX_CLIENT_CONN: 200...", model: 'codex-mini', category: 'deployment', intent: 'generate', successScore: 0.83, reuseScore: 0.65 },
  { id: 'prompt-043', sourceId: 'src-codex', projectId: 'proj-api', sessionId: 'sess-008', dayOffset: 18, hourOffset: 1, promptText: 'Add connection pool health metrics - active connections, idle connections, wait queue size. Expose via /health endpoint.', responsePreview: "Here's how to expose pool metrics:\n\n```typescript\nimport { Pool } from 'pg';\n\nexport function getPoolMetrics(pool: Pool) {\n  return {\n    totalCount: pool.totalCount,\n    idleCount: pool.idleCount,\n    waitingCount: pool.waitingCount,\n    activeCount: pool.totalCount - pool.idleCount,\n    maxConnections: pool.options.max...", model: 'codex-mini', category: 'code-generation', intent: 'generate', successScore: 0.88, reuseScore: 0.70 },
  { id: 'prompt-089', sourceId: 'src-codex', projectId: 'proj-api', sessionId: 'sess-008', dayOffset: 17, hourOffset: 3, promptText: 'Add request logging middleware that captures method, path, status code, response time, and user ID. Use structured JSON logging.', responsePreview: "Here's a structured logging middleware using pino:\n\n```typescript\nimport pino from 'pino';\nimport { Request, Response, NextFunction } from 'express';\n\nconst logger = pino({ level: process.env.LOG_LEVEL || 'info' });\n\nexport function requestLogger(req: Request, res: Response, next: NextFunction) {\n  const start = process.hrtime.bigint()...", model: 'codex-mini', category: 'code-generation', intent: 'generate', successScore: 0.87, reuseScore: 0.78 },

  // ---- Session 009: RN navigation (mobile, claude-code) ----
  { id: 'prompt-044', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 0, promptText: 'Restructure the React Navigation setup to use a proper auth flow. Unauthenticated users see Login/Register, authenticated users see the main tab navigator.', responsePreview: "Here's the recommended pattern using React Navigation 6 with conditional rendering based on auth state:\n\n```tsx\nimport { NavigationContainer } from '@react-navigation/native';\nimport { createNativeStackNavigator } from '@react-navigation/native-stack';\n\nconst Stack = createNativeStackNavigator()...", model: 'claude-3.5-sonnet', category: 'refactor', intent: 'instruct', successScore: 0.90, reuseScore: 0.75 },
  { id: 'prompt-045', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 0.5, promptText: 'Add type-safe navigation with proper screen params. Currently getting TypeScript errors when navigating between screens.', responsePreview: "You need to define a RootParamList type and pass it to the navigator. Here's the full type-safe setup:\n\n```typescript\nexport type RootStackParamList = {\n  Login: undefined;\n  Register: { referralCode?: string };\n  Main: undefined;\n  Profile: { userId: string };\n  Settings: undefined...", model: 'claude-3.5-sonnet', category: 'refactor', intent: 'fix', successScore: 0.92, reuseScore: 0.80 },
  { id: 'prompt-046', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 1, promptText: 'Implement deep linking for the mobile app. Should handle URLs like myapp://product/123 and https://myapp.com/product/123', responsePreview: "Here's deep linking configuration for both URL schemes:\n\n```typescript\nconst linking: LinkingOptions<RootStackParamList> = {\n  prefixes: ['myapp://', 'https://myapp.com'],\n  config: {\n    screens: {\n      Main: {\n        screens: {\n          Home: 'home',\n          Products: 'products'...", model: 'claude-3-opus', category: 'code-generation', intent: 'instruct', successScore: 0.85, reuseScore: 0.70 },
  { id: 'prompt-047', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 2, promptText: 'The bottom tab bar icons are misaligned on Android. The badge count overlaps with the tab label on smaller screens.', responsePreview: "This is a common issue with React Navigation's bottom tabs on Android. The fix involves custom tab bar styling:\n\n```tsx\n<Tab.Navigator\n  screenOptions={({ route }) => ({\n    tabBarIcon: ({ focused, color, size }) => {\n      return (\n        <View style={{ alignItems: 'center', justifyContent: 'center'...", model: 'claude-3.5-sonnet', category: 'styling', intent: 'fix', successScore: 0.78, reuseScore: 0.45 },
  { id: 'prompt-048', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 3, promptText: 'Add screen transition animations - slide from right for push, fade for modals, slide up for bottom sheets', responsePreview: "Here are custom screen transition animations:\n\n```typescript\nimport { TransitionPresets } from '@react-navigation/stack';\n\nconst slideFromRight = {\n  gestureDirection: 'horizontal',\n  transitionSpec: {\n    open: { animation: 'timing', config: { duration: 250 } },\n    close: { animation: 'timing', config: { duration: 200 } }...", model: 'claude-3-opus', category: 'styling', intent: 'generate', successScore: 0.83, reuseScore: 0.60 },
  { id: 'prompt-049', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-009', dayOffset: 15, hourOffset: 4, promptText: 'Write a navigation analytics hook that tracks screen views and sends them to our analytics service', responsePreview: "Here's a useNavigationAnalytics hook that integrates with React Navigation's state tracking:\n\n```typescript\nimport { useNavigationState, useRoute } from '@react-navigation/native';\nimport { useEffect, useRef } from 'react';\nimport { analytics } from '../services/analytics';\n\nexport function useNavigationAnalytics()...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.86, reuseScore: 0.72 },

  // ---- Session 010: Dark mode (design, cursor) ----
  { id: 'prompt-050', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 12, hourOffset: 0, promptText: 'Implement dark mode toggle for the design system. Use CSS custom properties with a data-theme attribute on html. Should respect system preference by default.', responsePreview: "Here's a complete dark mode implementation:\n\n```css\n/* Base tokens - light mode (default) */\n:root {\n  --bg-primary: #ffffff;\n  --bg-secondary: #f8f9fa;\n  --text-primary: #1a1a2e;\n  --text-secondary: #6b7280;\n  --border-default: #e5e7eb;\n}\n\n/* Dark mode tokens */\n[data-theme='dark'] {\n  --bg-primary: #0f0f23...", model: 'gpt-4o', category: 'styling', intent: 'instruct', successScore: 0.93, reuseScore: 0.85 },
  { id: 'prompt-051', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 12, hourOffset: 0.5, promptText: 'Create a useTheme hook that persists the theme preference in localStorage and syncs across tabs', responsePreview: "Here's a useTheme hook with localStorage persistence and cross-tab sync:\n\n```typescript\nimport { useState, useEffect, useCallback } from 'react';\n\ntype Theme = 'light' | 'dark' | 'system';\n\nexport function useTheme() {\n  const [theme, setThemeState] = useState<Theme>(() => {\n    if (typeof window === 'undefined') return 'system'...", model: 'gpt-4o', category: 'code-generation', intent: 'generate', successScore: 0.91, reuseScore: 0.90 },
  { id: 'prompt-052', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 12, hourOffset: 1, promptText: "Some components have hardcoded colors that don't change with dark mode. Find and fix all color references that should use CSS variables instead.", responsePreview: "I found several hardcoded colors that need to be converted to CSS variables:\n\n1. **Card.tsx**: `backgroundColor: '#fff'` should be `var(--bg-primary)`\n2. **Sidebar.tsx**: `borderRight: '1px solid #e5e7eb'` should use `var(--border-default)`\n3. **Badge.tsx**: Multiple hardcoded hex values...", model: 'gpt-4o', category: 'refactor', intent: 'fix', successScore: 0.85, reuseScore: 0.50 },
  { id: 'prompt-053', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 12, hourOffset: 1.5, promptText: 'Add a smooth color transition when switching themes. Currently the switch is jarring.', responsePreview: "Add a CSS transition on the root element for smooth theme switching:\n\n```css\nhtml {\n  transition: background-color 0.3s ease, color 0.3s ease;\n}\n\n/* Apply transition to all elements that use theme colors */\nhtml * {\n  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease...", model: 'gpt-4o', category: 'styling', intent: 'instruct', successScore: 0.80, reuseScore: 0.65 },
  { id: 'prompt-054', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 12, hourOffset: 2, promptText: 'Write visual regression tests for dark mode using Playwright. Compare screenshots of key components in light and dark modes.', responsePreview: "Here's a Playwright visual regression test setup:\n\n```typescript\nimport { test, expect } from '@playwright/test';\n\nconst components = ['Button', 'Card', 'Dialog', 'Input', 'Badge', 'Table'];\nconst themes = ['light', 'dark'] as const;\n\nfor (const component of components) {\n  for (const theme of themes) {\n    test(`${component} - ${theme} mode`...", model: 'gpt-4o', category: 'testing', intent: 'generate', successScore: 0.84, reuseScore: 0.68 },
  { id: 'prompt-090', sourceId: 'src-cursor', projectId: 'proj-design', sessionId: 'sess-010', dayOffset: 11, hourOffset: 3, promptText: 'Create an accessible color palette that meets WCAG AA contrast ratios in both light and dark modes. Include semantic colors: success, warning, error, info.', responsePreview: "Here's a WCAG AA compliant color palette with semantic tokens:\n\n```css\n:root {\n  /* Semantic colors - light mode */\n  --color-success: #16a34a;       /* 4.5:1 on white */\n  --color-success-bg: #f0fdf4;\n  --color-warning: #b45309;        /* 4.6:1 on white */\n  --color-warning-bg: #fffbeb...", model: 'gpt-4o', category: 'styling', intent: 'generate', successScore: 0.89, reuseScore: 0.82 },

  // ---- Session 011: Streaming data (data, gemini) ----
  { id: 'prompt-055', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 10, hourOffset: 0, promptText: 'Build a real-time data streaming processor using Node.js streams. It needs to handle backpressure when the consumer is slower than the producer.', responsePreview: "Here's a streaming processor with proper backpressure handling using Node.js Transform streams:\n\n```typescript\nimport { Transform, TransformCallback, pipeline } from 'stream';\nimport { promisify } from 'util';\n\nconst pipelineAsync = promisify(pipeline);\n\nclass DataTransformer extends Transform...", model: 'gemini-pro', category: 'code-generation', intent: 'generate', successScore: 0.87, reuseScore: 0.72 },
  { id: 'prompt-056', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 10, hourOffset: 0.5, promptText: 'Add Kafka consumer integration to the streaming processor. Should commit offsets only after successful processing of each batch.', responsePreview: "Here's a Kafka consumer with manual offset management:\n\n```typescript\nimport { Kafka, Consumer, EachBatchPayload } from 'kafkajs';\n\nconst kafka = new Kafka({\n  clientId: 'data-processor',\n  brokers: process.env.KAFKA_BROKERS!.split(','),\n});\n\nasync function startConsumer() {\n  const consumer = kafka.consumer({ groupId: 'processor-group' })...", model: 'gemini-pro', category: 'code-generation', intent: 'instruct', successScore: 0.84, reuseScore: 0.65 },
  { id: 'prompt-057', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 10, hourOffset: 1, promptText: 'Explain the difference between at-least-once and exactly-once delivery semantics in Kafka. Which should we use?', responsePreview: "**At-least-once delivery**: Messages may be processed more than once if a consumer crashes after processing but before committing the offset. This is the default in most Kafka setups.\n\n**Exactly-once delivery**: Each message is processed exactly once, even in failure scenarios...", model: 'gemini-pro', category: 'exploratory', intent: 'explain', successScore: 0.90, reuseScore: 0.42 },
  { id: 'prompt-058', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 10, hourOffset: 2, promptText: 'Write a Dockerfile for the streaming processor. Multi-stage build, non-root user, health check endpoint.', responsePreview: "Here's an optimized multi-stage Dockerfile:\n\n```dockerfile\n# Stage 1: Build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production && cp -R node_modules prod_node_modules\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# Stage 2: Production\nFROM node:20-alpine...", model: 'gemini-pro', category: 'deployment', intent: 'generate', successScore: 0.89, reuseScore: 0.80 },
  { id: 'prompt-059', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 10, hourOffset: 3, promptText: 'Add structured logging with correlation IDs that propagate through the entire processing pipeline', responsePreview: "Here's a structured logging setup with correlation ID propagation using AsyncLocalStorage:\n\n```typescript\nimport { AsyncLocalStorage } from 'async_hooks';\nimport pino from 'pino';\nimport { randomUUID } from 'crypto';\n\ninterface RequestContext {\n  correlationId: string;\n  source: string;\n  batchId?: string...", model: 'gemini-pro', category: 'code-generation', intent: 'instruct', successScore: 0.86, reuseScore: 0.75 },
  { id: 'prompt-088', sourceId: 'src-gemini', projectId: 'proj-data', sessionId: 'sess-011', dayOffset: 9, hourOffset: 1, promptText: "Optimize the PostgreSQL query for the daily aggregation report. It's scanning 10M rows and takes 45 seconds. Here's the current query.", responsePreview: "There are several optimizations we can apply:\n\n1. **Add a covering index** for the most common query pattern:\n```sql\nCREATE INDEX idx_events_daily ON events (event_date, event_type) INCLUDE (amount, user_id);\n```\n\n2. **Use a materialized view** for the daily aggregation...", model: 'gemini-pro', category: 'performance', intent: 'fix', successScore: 0.93, reuseScore: 0.70 },

  // ---- Session 012: E2E tests (acme, claude-code) ----
  { id: 'prompt-060', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 7, hourOffset: 0, promptText: 'Set up Playwright for E2E testing. Configure it to test against our Next.js dev server with three browsers: Chrome, Firefox, Safari.', responsePreview: "Here's the Playwright configuration for your Next.js app:\n\n```typescript\nimport { defineConfig, devices } from '@playwright/test';\n\nexport default defineConfig({\n  testDir: './e2e',\n  fullyParallel: true,\n  forbidOnly: !!process.env.CI,\n  retries: process.env.CI ? 2 : 0,\n  workers: process.env.CI ? 1 : undefined...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'instruct', successScore: 0.91, reuseScore: 0.82 },
  { id: 'prompt-061', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 7, hourOffset: 0.5, promptText: 'Write an E2E test for the complete checkout flow: add item to cart, go to checkout, fill in shipping info, submit order, verify confirmation page.', responsePreview: "Here's a comprehensive checkout flow test:\n\n```typescript\nimport { test, expect } from '@playwright/test';\n\ntest.describe('Checkout Flow', () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto('/products');\n  });\n\n  test('complete checkout from product listing to confirmation', async ({ page }) => {\n    // Add item to cart...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'generate', successScore: 0.88, reuseScore: 0.72 },
  { id: 'prompt-062', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 7, hourOffset: 1, promptText: 'Create a Page Object Model for the checkout page to make tests more maintainable', responsePreview: "Here's a POM for the checkout flow:\n\n```typescript\nimport { Page, Locator, expect } from '@playwright/test';\n\nexport class CheckoutPage {\n  readonly page: Page;\n  readonly shippingForm: Locator;\n  readonly emailInput: Locator;\n  readonly addressInput: Locator;\n  readonly submitButton: Locator;\n  readonly orderSummary: Locator...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'generate', successScore: 0.90, reuseScore: 0.78 },
  { id: 'prompt-063', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 7, hourOffset: 1.5, promptText: "Add API mocking to Playwright tests. Mock the payment gateway responses so we don't hit the real Stripe API in tests.", responsePreview: "Use Playwright's route interception to mock API calls:\n\n```typescript\nimport { test, expect } from '@playwright/test';\n\ntest.beforeEach(async ({ page }) => {\n  // Mock Stripe payment intent creation\n  await page.route('**/api/create-payment-intent', async (route) => {\n    await route.fulfill({\n      status: 200...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'instruct', successScore: 0.87, reuseScore: 0.70 },
  { id: 'prompt-064', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 7, hourOffset: 2, promptText: "The E2E tests are flaky in CI. The checkout button click sometimes doesn't work. How to make it more reliable?", responsePreview: "Flaky click issues usually come from elements not being fully interactive when clicked. Here are the fixes:\n\n1. **Wait for network idle** before interacting:\n```typescript\nawait page.waitForLoadState('networkidle');\n```\n\n2. **Use actionability checks** - Playwright does this by default...", model: 'claude-3.5-sonnet', category: 'debugging', intent: 'fix', successScore: 0.82, reuseScore: 0.55 },
  { id: 'prompt-091', sourceId: 'src-claude-code', projectId: 'proj-acme', sessionId: 'sess-012', dayOffset: 6, hourOffset: 5, promptText: 'Add error boundary components to catch and display errors gracefully in production. Include error reporting to Sentry.', responsePreview: "Here's a production-ready error boundary with Sentry integration:\n\n```tsx\nimport React, { Component, ErrorInfo, ReactNode } from 'react';\nimport * as Sentry from '@sentry/nextjs';\n\ninterface Props {\n  children: ReactNode;\n  fallback?: ReactNode;\n}\n\ninterface State {\n  hasError: boolean;\n  error: Error | null...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.90, reuseScore: 0.82 },

  // ---- Session 013: Rate limiting (api, cursor) ----
  { id: 'prompt-065', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 5, hourOffset: 0, promptText: 'Implement a sliding window rate limiter using Redis sorted sets. Need per-user and per-IP limits with different thresholds.', responsePreview: "Here's a sliding window rate limiter using Redis ZSET:\n\n```typescript\nimport Redis from 'ioredis';\n\ninterface RateLimitConfig {\n  windowMs: number;\n  maxRequests: number;\n}\n\nexport class SlidingWindowRateLimiter {\n  constructor(private redis: Redis) {}\n\n  async isAllowed(key: string, config: RateLimitConfig)...", model: 'gpt-4o', category: 'code-generation', intent: 'generate', successScore: 0.92, reuseScore: 0.85 },
  { id: 'prompt-066', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 5, hourOffset: 0.5, promptText: 'Add Redis-based response caching middleware. Cache GET responses for 5 minutes, with cache invalidation on POST/PUT/DELETE to the same resource.', responsePreview: "Here's a smart caching middleware:\n\n```typescript\nimport { Request, Response, NextFunction } from 'express';\nimport Redis from 'ioredis';\nimport crypto from 'crypto';\n\nexport function cacheMiddleware(redis: Redis, ttl = 300) {\n  return async (req: Request, res: Response, next: NextFunction) => {\n    if (req.method !== 'GET')...", model: 'gpt-4o', category: 'code-generation', intent: 'generate', successScore: 0.89, reuseScore: 0.80 },
  { id: 'prompt-067', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 5, hourOffset: 1, promptText: 'The Redis cache is using 2GB of memory. Add LRU eviction and key expiration policies. Also add cache hit/miss metrics.', responsePreview: "Configure Redis memory management and add metrics:\n\n```bash\n# Redis configuration\nmaxmemory 512mb\nmaxmemory-policy allkeys-lru\n```\n\nFor metrics, wrap your cache operations:\n\n```typescript\nimport { Counter, Histogram } from 'prom-client';\n\nconst cacheHits = new Counter({ name: 'cache_hits_total'...", model: 'claude-3.5-sonnet', category: 'performance', intent: 'instruct', successScore: 0.86, reuseScore: 0.68 },
  { id: 'prompt-068', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 5, hourOffset: 2, promptText: 'Write load tests using k6 to verify the rate limiter works correctly under concurrent traffic', responsePreview: "Here's a k6 load test script:\n\n```javascript\nimport http from 'k6/http';\nimport { check, sleep } from 'k6';\nimport { Rate, Counter } from 'k6/metrics';\n\nconst rateLimitedRate = new Rate('rate_limited');\nconst successRate = new Rate('success_rate');\n\nexport const options = {\n  scenarios: {\n    burst: {\n      executor: 'ramping-arrival-rate'...", model: 'claude-3.5-sonnet', category: 'testing', intent: 'generate', successScore: 0.84, reuseScore: 0.72 },
  { id: 'prompt-069', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 5, hourOffset: 3, promptText: 'Compare Redis vs Memcached for our caching layer. We need pub/sub for cache invalidation across multiple app servers.', responsePreview: "Here's a comparison for your specific use case:\n\n| Feature | Redis | Memcached |\n|---------|-------|-----------|\n| Data structures | Rich (strings, hashes, lists, sets, sorted sets) | Simple key-value |\n| Pub/Sub | Built-in | Not available |\n| Persistence | Optional (RDB/AOF) | None...", model: 'gpt-4o', category: 'exploratory', intent: 'compare', successScore: 0.88, reuseScore: 0.45 },
  { id: 'prompt-092', sourceId: 'src-cursor', projectId: 'proj-api', sessionId: 'sess-013', dayOffset: 4, hourOffset: 5, promptText: 'Add OpenAPI/Swagger documentation to the Express API. Auto-generate from route handlers and Zod schemas.', responsePreview: "Use zod-to-openapi to generate Swagger docs from your existing Zod schemas:\n\n```typescript\nimport { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';\nimport { z } from 'zod';\nimport { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';\n\nextendZodWithOpenApi(z)...", model: 'gpt-4o', category: 'documentation', intent: 'generate', successScore: 0.87, reuseScore: 0.78 },

  // ---- Session 014: Schema migration (data, codex) ----
  { id: 'prompt-070', sourceId: 'src-codex', projectId: 'proj-data', sessionId: 'sess-014', dayOffset: 3, hourOffset: 0, promptText: 'Create a database migration to add a `processed_at` timestamp column and a `status` enum column to the pipeline_jobs table. Must be backwards compatible.', responsePreview: "Here's a safe migration that adds the columns without breaking existing code:\n\n```sql\n-- Migration: 20260328_add_job_status_columns\n\nALTER TABLE pipeline_jobs\nADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;\n\nALTER TABLE pipeline_jobs\nADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'...", model: 'codex-mini', category: 'data-backend', intent: 'generate', successScore: 0.90, reuseScore: 0.70 },
  { id: 'prompt-071', sourceId: 'src-codex', projectId: 'proj-data', sessionId: 'sess-014', dayOffset: 3, hourOffset: 0.3, promptText: 'Write a backfill script to populate the new status column based on the existing is_complete and error_message columns', responsePreview: "Here's a safe backfill script with batch processing:\n\n```sql\n-- Backfill in batches of 10000 to avoid long locks\nDO $$\nDECLARE\n  batch_size INT := 10000;\n  affected INT;\nBEGIN\n  LOOP\n    UPDATE pipeline_jobs\n    SET status = CASE\n      WHEN is_complete = true AND error_message IS NULL THEN 'completed'...", model: 'codex-mini', category: 'data-backend', intent: 'generate', successScore: 0.87, reuseScore: 0.60 },
  { id: 'prompt-072', sourceId: 'src-codex', projectId: 'proj-data', sessionId: 'sess-014', dayOffset: 3, hourOffset: 0.6, promptText: 'Add an index on (status, created_at) for the pipeline_jobs table. It needs to be created concurrently to avoid locking the table.', responsePreview: "Use CREATE INDEX CONCURRENTLY to avoid blocking writes:\n\n```sql\n-- This must be run outside a transaction block\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipeline_jobs_status_created\nON pipeline_jobs (status, created_at DESC);\n\n-- Also add a partial index for active jobs (much smaller, faster lookups)...", model: 'codex-mini', category: 'data-backend', intent: 'instruct', successScore: 0.92, reuseScore: 0.65 },
  { id: 'prompt-073', sourceId: 'src-codex', projectId: 'proj-data', sessionId: 'sess-014', dayOffset: 3, hourOffset: 1, promptText: 'Create a rollback migration that safely removes the new columns if we need to revert', responsePreview: "Here's the rollback migration:\n\n```sql\n-- Rollback: 20260328_add_job_status_columns\n\n-- Drop the partial index first\nDROP INDEX IF EXISTS idx_pipeline_jobs_active;\n\n-- Drop the composite index\nDROP INDEX IF EXISTS idx_pipeline_jobs_status_created;\n\n-- Drop the constraint\nALTER TABLE pipeline_jobs\nDROP CONSTRAINT IF EXISTS valid_status...", model: 'codex-mini', category: 'data-backend', intent: 'generate', successScore: 0.88, reuseScore: 0.55 },

  // ---- Session 015: Push notifications (mobile, claude-code) ----
  { id: 'prompt-074', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-015', dayOffset: 1, hourOffset: 0, promptText: 'Set up push notifications with Firebase Cloud Messaging for the React Native app. Need to handle both foreground and background notifications.', responsePreview: "Here's the FCM setup for React Native:\n\n```typescript\nimport messaging from '@react-native-firebase/messaging';\nimport notifee from '@notifee/react-native';\n\n// Request permission\nasync function requestPermission() {\n  const authStatus = await messaging().requestPermission();\n  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'instruct', successScore: 0.88, reuseScore: 0.72 },
  { id: 'prompt-075', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-015', dayOffset: 1, hourOffset: 0.5, promptText: 'Create a notification preferences screen where users can toggle different notification categories: orders, promotions, system alerts.', responsePreview: "Here's a notification preferences screen with persistent storage:\n\n```tsx\nimport { useState, useEffect } from 'react';\nimport { View, Switch, Text, StyleSheet } from 'react-native';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\nimport messaging from '@react-native-firebase/messaging'...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.85, reuseScore: 0.68 },
  { id: 'prompt-076', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-015', dayOffset: 1, hourOffset: 1, promptText: 'Write the backend endpoint for sending push notifications. Should support sending to individual users, user segments, and broadcast to all.', responsePreview: "Here's the notification sending service:\n\n```typescript\nimport admin from 'firebase-admin';\n\ninterface NotificationPayload {\n  title: string;\n  body: string;\n  data?: Record<string, string>;\n  imageUrl?: string;\n}\n\nexport class NotificationService {\n  private messaging = admin.messaging();\n\n  async sendToUser(userId: string, payload: NotificationPayload)...", model: 'claude-3-opus', category: 'code-generation', intent: 'generate', successScore: 0.90, reuseScore: 0.78 },
  { id: 'prompt-077', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-015', dayOffset: 1, hourOffset: 1.5, promptText: 'Handle notification deep links - when user taps a notification, navigate to the relevant screen based on the notification data payload.', responsePreview: "Here's notification deep link handling with React Navigation:\n\n```typescript\nimport messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';\nimport { navigationRef } from './NavigationContainer';\n\nexport function setupNotificationHandlers() {\n  // Handle notification when app is in background and user taps it...", model: 'claude-3-opus', category: 'code-generation', intent: 'instruct', successScore: 0.86, reuseScore: 0.70 },
  { id: 'prompt-078', sourceId: 'src-claude-code', projectId: 'proj-mobile', sessionId: 'sess-015', dayOffset: 1, hourOffset: 2, promptText: 'Add notification badges to the app icon. The badge count should reflect unread notifications stored in the backend.', responsePreview: "Here's badge management for both iOS and Android:\n\n```typescript\nimport notifee from '@notifee/react-native';\nimport { Platform } from 'react-native';\n\nexport class BadgeManager {\n  static async updateBadgeCount(count: number) {\n    if (Platform.OS === 'ios') {\n      await notifee.setBadgeCount(count);\n    } else {\n      await notifee.setBadgeCount(count)...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'instruct', successScore: 0.81, reuseScore: 0.60 },

  // ---- Session 016: Deploy fixes (acme, cursor) ----
  { id: 'prompt-079', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-016', dayOffset: 0, hourOffset: 12, promptText: 'The Vercel deployment is failing with "ENOMEM" during the build step. How do I optimize the Next.js build to use less memory?', responsePreview: "ENOMEM during Next.js builds usually means the Node.js heap is running out of memory. Here are the fixes in order of impact:\n\n1. **Increase Node memory limit** in your build command:\n```json\n\"build\": \"NODE_OPTIONS='--max-old-space-size=4096' next build\"\n```\n\n2. **Reduce bundle size**...", model: 'gpt-4o', category: 'debugging', intent: 'fix', successScore: 0.88, reuseScore: 0.55 },
  { id: 'prompt-080', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-016', dayOffset: 0, hourOffset: 11, promptText: 'Set up preview deployments on Vercel for every PR. Each preview should use its own database branch.', responsePreview: "Here's how to set up preview deployments with isolated databases:\n\n1. **Vercel preview deployments** are automatic for PRs. Configure in `vercel.json`:\n```json\n{\n  \"git\": {\n    \"deploymentEnabled\": {\n      \"main\": true,\n      \"preview\": true\n    }\n  }\n}\n```\n\n2. **Database branching** using Neon...", model: 'claude-3.5-sonnet', category: 'deployment', intent: 'instruct', successScore: 0.85, reuseScore: 0.72 },
  { id: 'prompt-081', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-016', dayOffset: 0, hourOffset: 10, promptText: 'Add environment variable validation at build time using zod. If required env vars are missing, fail the build with a clear error message.', responsePreview: "Create an env validation module that runs at build time:\n\n```typescript\n// src/env.ts\nimport { z } from 'zod';\n\nconst envSchema = z.object({\n  DATABASE_URL: z.string().url(),\n  NEXTAUTH_SECRET: z.string().min(32),\n  NEXTAUTH_URL: z.string().url(),\n  STRIPE_SECRET_KEY: z.string().startsWith('sk_')...", model: 'claude-3.5-sonnet', category: 'code-generation', intent: 'generate', successScore: 0.93, reuseScore: 0.88 },
  { id: 'prompt-082', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-016', dayOffset: 0, hourOffset: 9, promptText: 'Explain server components vs client components in Next.js 14 App Router. When should I use each?', responsePreview: "**Server Components** (default in App Router):\n- Run only on the server, never shipped to the client bundle\n- Can directly access databases, file systems, and server-only APIs\n- Cannot use hooks (useState, useEffect) or browser APIs\n- Use for: data fetching, accessing backend resources...", model: 'gpt-4o', category: 'exploratory', intent: 'explain', successScore: 0.94, reuseScore: 0.38 },
  { id: 'prompt-095', sourceId: 'src-cursor', projectId: 'proj-acme', sessionId: 'sess-016', dayOffset: 0, hourOffset: 8, promptText: 'Configure Next.js image optimization. Our product images are loading slowly and Core Web Vitals LCP is 4.2 seconds.', responsePreview: "Here's how to optimize images and improve LCP:\n\n1. **Use next/image with proper sizing**:\n```tsx\nimport Image from 'next/image';\n\n<Image\n  src={product.imageUrl}\n  alt={product.name}\n  width={400}\n  height={300}\n  sizes=\"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw\"\n  priority={isAboveFold}...", model: 'gpt-4o', category: 'performance', intent: 'fix', successScore: 0.91, reuseScore: 0.72 },

  // ---- Session 017: Imported legacy (acme, json-import) ----
  { id: 'prompt-083', sourceId: 'src-json', projectId: 'proj-acme', sessionId: 'sess-017', dayOffset: 35, hourOffset: 0, promptText: 'How do I set up a monorepo with Turborepo for our Next.js app, shared UI library, and API server?', responsePreview: "Here's the Turborepo monorepo structure:\n\n```\nmy-monorepo/\n  apps/\n    web/        # Next.js app\n    api/        # Express/Fastify server\n  packages/\n    ui/         # Shared React components\n    config/     # Shared ESLint, TypeScript configs\n    types/      # Shared TypeScript types...", model: 'gpt-4', category: 'architecture', intent: 'plan', successScore: 0.86, reuseScore: 0.70 },
  { id: 'prompt-084', sourceId: 'src-json', projectId: 'proj-acme', sessionId: 'sess-017', dayOffset: 34, hourOffset: 0, promptText: 'Create a shared ESLint config that works across all packages in the monorepo. Include React rules, TypeScript rules, and import sorting.', responsePreview: "Create the shared ESLint config package:\n\n```json\n// packages/config/eslint/package.json\n{\n  \"name\": \"@acme/eslint-config\",\n  \"version\": \"0.0.1\",\n  \"main\": \"index.js\"\n}\n```\n\n```javascript\n// packages/config/eslint/index.js\nmodule.exports = {\n  extends: [\n    'eslint:recommended'...", model: 'gpt-4', category: 'deployment', intent: 'generate', successScore: 0.82, reuseScore: 0.75 },
  { id: 'prompt-085', sourceId: 'src-json', projectId: 'proj-acme', sessionId: 'sess-017', dayOffset: 33, hourOffset: 0, promptText: 'Set up semantic versioning and changesets for the monorepo packages. Auto-generate changelogs on release.', responsePreview: "Here's the changeset configuration for your monorepo:\n\n```bash\nnpx changeset init\n```\n\n```json\n// .changeset/config.json\n{\n  \"$schema\": \"https://unpkg.com/@changesets/config@3.0.0/schema.json\",\n  \"changelog\": \"@changesets/changelog-github\",\n  \"commit\": false,\n  \"fixed\": [],\n  \"linked\": []...", model: 'gpt-4', category: 'deployment', intent: 'instruct', successScore: 0.84, reuseScore: 0.65 },
];

// Build full Prompt objects from seeds
const MODEL_COSTS: Record<string, number> = {
  'gpt-4': 0.03, 'gpt-4o': 0.005, 'claude-3.5-sonnet': 0.003,
  'claude-3-opus': 0.015, 'gemini-pro': 0.00125, 'codex-mini': 0.0015,
};

export const demoPrompts: Prompt[] = promptSeeds.map((seed) => {
  const ts = ago(seed.dayOffset, seed.hourOffset);
  const promptLength = seed.promptText.length;
  const tokenEstimate = Math.ceil(promptLength / 4);
  const costPer1k = MODEL_COSTS[seed.model] ?? 0.003;
  const costEstimate = (tokenEstimate / 1000) * costPer1k;

  return {
    id: seed.id,
    sourceId: seed.sourceId,
    projectId: seed.projectId,
    sessionId: seed.sessionId,
    timestamp: ts,
    promptText: seed.promptText,
    responsePreview: seed.responsePreview.slice(0, 200),
    model: seed.model,
    promptLength,
    category: seed.category,
    intent: seed.intent,
    tokenEstimate,
    costEstimate: Math.round(costEstimate * 100000) / 100000,
    successScore: seed.successScore,
    reuseScore: seed.reuseScore,
    metadataJson: null,
    createdAt: ts,
    updatedAt: ts,
  };
});

// ---------------------------------------------------------------------------
// Prompt Files  (160+ entries with realistic per-prompt file paths)
// ---------------------------------------------------------------------------

interface FileSeed { promptId: string; filePath: string; actionType: string }

const fileSeeds: FileSeed[] = [
  // Session 001 - Auth refactor
  { promptId: 'prompt-001', filePath: 'src/middleware/auth.ts', actionType: 'modified' },
  { promptId: 'prompt-001', filePath: 'src/services/token.service.ts', actionType: 'created' },
  { promptId: 'prompt-001', filePath: 'src/config/jwt.config.ts', actionType: 'created' },
  { promptId: 'prompt-002', filePath: 'src/controllers/auth.controller.ts', actionType: 'modified' },
  { promptId: 'prompt-002', filePath: 'src/services/token.service.ts', actionType: 'modified' },
  { promptId: 'prompt-003', filePath: 'src/types/auth.ts', actionType: 'created' },
  { promptId: 'prompt-003', filePath: 'src/middleware/auth.ts', actionType: 'modified' },
  { promptId: 'prompt-004', filePath: 'src/services/__tests__/token.service.test.ts', actionType: 'created' },
  { promptId: 'prompt-005', filePath: 'docs/architecture/auth-tokens.md', actionType: 'created' },
  { promptId: 'prompt-006', filePath: 'src/services/token-blacklist.ts', actionType: 'created' },
  { promptId: 'prompt-006', filePath: 'src/config/redis.config.ts', actionType: 'modified' },
  { promptId: 'prompt-007', filePath: 'src/controllers/auth.controller.ts', actionType: 'modified' },
  { promptId: 'prompt-007', filePath: 'src/routes/auth.routes.ts', actionType: 'modified' },
  // Session 002 - API pagination
  { promptId: 'prompt-008', filePath: 'src/controllers/products.controller.ts', actionType: 'modified' },
  { promptId: 'prompt-008', filePath: 'src/utils/pagination.ts', actionType: 'created' },
  { promptId: 'prompt-009', filePath: 'src/utils/pagination.ts', actionType: 'modified' },
  { promptId: 'prompt-009', filePath: 'src/types/pagination.ts', actionType: 'created' },
  { promptId: 'prompt-010', filePath: 'src/types/pagination.ts', actionType: 'modified' },
  { promptId: 'prompt-010', filePath: 'src/utils/pagination.ts', actionType: 'modified' },
  { promptId: 'prompt-011', filePath: 'src/__tests__/products.integration.test.ts', actionType: 'created' },
  { promptId: 'prompt-011', filePath: 'src/__tests__/helpers/seed.ts', actionType: 'created' },
  { promptId: 'prompt-012', filePath: 'src/services/count-cache.ts', actionType: 'created' },
  { promptId: 'prompt-013', filePath: 'src/middleware/rate-limit.ts', actionType: 'created' },
  { promptId: 'prompt-013', filePath: 'src/config/redis.config.ts', actionType: 'modified' },
  { promptId: 'prompt-086', filePath: 'src/hooks/useFormValidation.ts', actionType: 'created' },
  { promptId: 'prompt-086', filePath: 'src/types/form.ts', actionType: 'created' },
  // Session 003 - Dashboard perf
  { promptId: 'prompt-014', filePath: 'src/screens/Dashboard.tsx', actionType: 'modified' },
  { promptId: 'prompt-014', filePath: 'src/hooks/useDashboardData.ts', actionType: 'modified' },
  { promptId: 'prompt-015', filePath: 'src/components/charts/BarChart.tsx', actionType: 'modified' },
  { promptId: 'prompt-015', filePath: 'src/screens/Dashboard.tsx', actionType: 'modified' },
  { promptId: 'prompt-016', filePath: 'src/hooks/useDebounce.ts', actionType: 'created' },
  { promptId: 'prompt-017', filePath: 'src/components/ActivityFeed.tsx', actionType: 'modified' },
  { promptId: 'prompt-017', filePath: 'package.json', actionType: 'modified' },
  { promptId: 'prompt-018', filePath: 'src/components/ActivityFeed.tsx', actionType: 'modified' },
  { promptId: 'prompt-019', filePath: 'docs/react-patterns.md', actionType: 'read' },
  { promptId: 'prompt-087', filePath: 'src/components/Skeleton.tsx', actionType: 'created' },
  { promptId: 'prompt-087', filePath: 'src/screens/Dashboard.tsx', actionType: 'modified' },
  // Session 004 - GraphQL migration
  { promptId: 'prompt-020', filePath: 'src/schema/user.graphql', actionType: 'created' },
  { promptId: 'prompt-020', filePath: 'src/resolvers/user.resolver.ts', actionType: 'created' },
  { promptId: 'prompt-020', filePath: 'src/routes/users.ts', actionType: 'read' },
  { promptId: 'prompt-021', filePath: 'src/loaders/order.loader.ts', actionType: 'created' },
  { promptId: 'prompt-021', filePath: 'src/resolvers/user.resolver.ts', actionType: 'modified' },
  { promptId: 'prompt-022', filePath: 'src/utils/graphql-errors.ts', actionType: 'created' },
  { promptId: 'prompt-022', filePath: 'src/types/errors.ts', actionType: 'read' },
  { promptId: 'prompt-023', filePath: 'codegen.yml', actionType: 'created' },
  { promptId: 'prompt-023', filePath: 'package.json', actionType: 'modified' },
  { promptId: 'prompt-024', filePath: 'src/schema/user.graphql', actionType: 'modified' },
  { promptId: 'prompt-024', filePath: 'src/resolvers/user.resolver.ts', actionType: 'modified' },
  { promptId: 'prompt-024', filePath: 'src/validators/user.validator.ts', actionType: 'created' },
  // Session 005 - Component library
  { promptId: 'prompt-025', filePath: 'package.json', actionType: 'created' },
  { promptId: 'prompt-025', filePath: 'tsup.config.ts', actionType: 'created' },
  { promptId: 'prompt-025', filePath: '.storybook/main.ts', actionType: 'created' },
  { promptId: 'prompt-026', filePath: 'src/components/Button/Button.tsx', actionType: 'created' },
  { promptId: 'prompt-026', filePath: 'src/components/Button/index.ts', actionType: 'created' },
  { promptId: 'prompt-027', filePath: 'src/components/Dialog/Dialog.tsx', actionType: 'created' },
  { promptId: 'prompt-027', filePath: 'src/components/Dialog/index.ts', actionType: 'created' },
  { promptId: 'prompt-028', filePath: 'src/components/Button/Button.stories.tsx', actionType: 'created' },
  { promptId: 'prompt-029', filePath: 'src/styles/tokens.css', actionType: 'created' },
  { promptId: 'prompt-029', filePath: 'tailwind.config.ts', actionType: 'modified' },
  { promptId: 'prompt-093', filePath: 'src/components/Input/Input.tsx', actionType: 'created' },
  { promptId: 'prompt-093', filePath: 'src/components/Input/index.ts', actionType: 'created' },
  // Session 006 - ETL pipeline
  { promptId: 'prompt-030', filePath: 'docs/architecture/pipeline.md', actionType: 'created' },
  { promptId: 'prompt-031', filePath: 'src/validators/csv_validator.py', actionType: 'created' },
  { promptId: 'prompt-031', filePath: 'src/schemas/order_schema.py', actionType: 'created' },
  { promptId: 'prompt-032', filePath: 'src/loaders/upsert_loader.py', actionType: 'created' },
  { promptId: 'prompt-033', filePath: 'src/monitoring/health_queries.sql', actionType: 'created' },
  { promptId: 'prompt-034', filePath: 'src/dlq/handler.py', actionType: 'created' },
  { promptId: 'prompt-034', filePath: 'infra/sqs.tf', actionType: 'modified' },
  { promptId: 'prompt-094', filePath: 'src/quality/validator.py', actionType: 'created' },
  { promptId: 'prompt-094', filePath: 'src/quality/checks.py', actionType: 'created' },
  // Session 007 - Testing suite
  { promptId: 'prompt-035', filePath: 'src/services/__tests__/user.service.test.ts', actionType: 'created' },
  { promptId: 'prompt-035', filePath: 'src/services/user.service.ts', actionType: 'read' },
  { promptId: 'prompt-036', filePath: 'src/__tests__/helpers/test-db.ts', actionType: 'created' },
  { promptId: 'prompt-036', filePath: 'src/__tests__/helpers/seed-data.ts', actionType: 'created' },
  { promptId: 'prompt-037', filePath: 'jest.config.ts', actionType: 'modified' },
  { promptId: 'prompt-038', filePath: '.github/workflows/ci.yml', actionType: 'created' },
  { promptId: 'prompt-038', filePath: 'vercel.json', actionType: 'created' },
  { promptId: 'prompt-039', filePath: 'jest.config.ts', actionType: 'modified' },
  { promptId: 'prompt-039', filePath: '.github/workflows/ci.yml', actionType: 'modified' },
  // Session 008 - DB connection pooling
  { promptId: 'prompt-040', filePath: 'src/db/pool.ts', actionType: 'modified' },
  { promptId: 'prompt-040', filePath: 'src/config/database.ts', actionType: 'read' },
  { promptId: 'prompt-041', filePath: 'src/db/pool.ts', actionType: 'modified' },
  { promptId: 'prompt-041', filePath: 'src/utils/with-connection.ts', actionType: 'created' },
  { promptId: 'prompt-042', filePath: 'docker-compose.yml', actionType: 'modified' },
  { promptId: 'prompt-042', filePath: 'config/pgbouncer.ini', actionType: 'created' },
  { promptId: 'prompt-043', filePath: 'src/routes/health.ts', actionType: 'modified' },
  { promptId: 'prompt-043', filePath: 'src/metrics/pool-metrics.ts', actionType: 'created' },
  { promptId: 'prompt-089', filePath: 'src/middleware/request-logger.ts', actionType: 'created' },
  { promptId: 'prompt-089', filePath: 'src/config/logger.ts', actionType: 'created' },
  // Session 009 - RN navigation
  { promptId: 'prompt-044', filePath: 'src/navigation/RootNavigator.tsx', actionType: 'modified' },
  { promptId: 'prompt-044', filePath: 'src/navigation/AuthStack.tsx', actionType: 'created' },
  { promptId: 'prompt-044', filePath: 'src/navigation/MainTabs.tsx', actionType: 'created' },
  { promptId: 'prompt-045', filePath: 'src/navigation/types.ts', actionType: 'created' },
  { promptId: 'prompt-045', filePath: 'src/navigation/RootNavigator.tsx', actionType: 'modified' },
  { promptId: 'prompt-046', filePath: 'src/navigation/linking.ts', actionType: 'created' },
  { promptId: 'prompt-046', filePath: 'src/navigation/RootNavigator.tsx', actionType: 'modified' },
  { promptId: 'prompt-047', filePath: 'src/navigation/MainTabs.tsx', actionType: 'modified' },
  { promptId: 'prompt-048', filePath: 'src/navigation/transitions.ts', actionType: 'created' },
  { promptId: 'prompt-049', filePath: 'src/hooks/useNavigationAnalytics.ts', actionType: 'created' },
  { promptId: 'prompt-049', filePath: 'src/services/analytics.ts', actionType: 'read' },
  // Session 010 - Dark mode
  { promptId: 'prompt-050', filePath: 'src/styles/themes.css', actionType: 'created' },
  { promptId: 'prompt-050', filePath: 'src/styles/globals.css', actionType: 'modified' },
  { promptId: 'prompt-051', filePath: 'src/hooks/useTheme.ts', actionType: 'created' },
  { promptId: 'prompt-052', filePath: 'src/components/Card.tsx', actionType: 'modified' },
  { promptId: 'prompt-052', filePath: 'src/components/Sidebar.tsx', actionType: 'modified' },
  { promptId: 'prompt-052', filePath: 'src/components/Badge.tsx', actionType: 'modified' },
  { promptId: 'prompt-053', filePath: 'src/styles/globals.css', actionType: 'modified' },
  { promptId: 'prompt-054', filePath: 'e2e/visual-regression.spec.ts', actionType: 'created' },
  { promptId: 'prompt-054', filePath: 'playwright.config.ts', actionType: 'modified' },
  { promptId: 'prompt-090', filePath: 'src/styles/colors.css', actionType: 'created' },
  { promptId: 'prompt-090', filePath: 'docs/color-palette.md', actionType: 'created' },
  // Session 011 - Streaming data
  { promptId: 'prompt-055', filePath: 'src/streams/data-transformer.ts', actionType: 'created' },
  { promptId: 'prompt-056', filePath: 'src/consumers/kafka-consumer.ts', actionType: 'created' },
  { promptId: 'prompt-056', filePath: 'src/config/kafka.ts', actionType: 'created' },
  { promptId: 'prompt-057', filePath: 'docs/kafka-delivery-semantics.md', actionType: 'read' },
  { promptId: 'prompt-058', filePath: 'Dockerfile', actionType: 'created' },
  { promptId: 'prompt-058', filePath: '.dockerignore', actionType: 'created' },
  { promptId: 'prompt-059', filePath: 'src/logging/logger.ts', actionType: 'created' },
  { promptId: 'prompt-059', filePath: 'src/logging/context.ts', actionType: 'created' },
  { promptId: 'prompt-088', filePath: 'src/queries/daily_aggregation.sql', actionType: 'modified' },
  { promptId: 'prompt-088', filePath: 'migrations/add_materialized_view.sql', actionType: 'created' },
  // Session 012 - E2E tests
  { promptId: 'prompt-060', filePath: 'playwright.config.ts', actionType: 'created' },
  { promptId: 'prompt-060', filePath: 'package.json', actionType: 'modified' },
  { promptId: 'prompt-061', filePath: 'e2e/checkout.spec.ts', actionType: 'created' },
  { promptId: 'prompt-062', filePath: 'e2e/pages/checkout.page.ts', actionType: 'created' },
  { promptId: 'prompt-063', filePath: 'e2e/checkout.spec.ts', actionType: 'modified' },
  { promptId: 'prompt-063', filePath: 'e2e/mocks/stripe.ts', actionType: 'created' },
  { promptId: 'prompt-064', filePath: 'e2e/checkout.spec.ts', actionType: 'modified' },
  { promptId: 'prompt-091', filePath: 'src/components/ErrorBoundary.tsx', actionType: 'created' },
  { promptId: 'prompt-091', filePath: 'src/config/sentry.ts', actionType: 'modified' },
  // Session 013 - Rate limiting
  { promptId: 'prompt-065', filePath: 'src/middleware/rate-limiter.ts', actionType: 'created' },
  { promptId: 'prompt-066', filePath: 'src/middleware/cache.ts', actionType: 'created' },
  { promptId: 'prompt-066', filePath: 'src/utils/cache-key.ts', actionType: 'created' },
  { promptId: 'prompt-067', filePath: 'config/redis.conf', actionType: 'created' },
  { promptId: 'prompt-067', filePath: 'src/metrics/cache-metrics.ts', actionType: 'created' },
  { promptId: 'prompt-068', filePath: 'k6/rate-limit.test.js', actionType: 'created' },
  { promptId: 'prompt-068', filePath: 'k6/config.js', actionType: 'created' },
  { promptId: 'prompt-069', filePath: 'docs/caching-strategy.md', actionType: 'read' },
  { promptId: 'prompt-092', filePath: 'src/docs/openapi.ts', actionType: 'created' },
  { promptId: 'prompt-092', filePath: 'src/routes/docs.ts', actionType: 'created' },
  // Session 014 - Schema migration
  { promptId: 'prompt-070', filePath: 'migrations/20260328_add_job_status.sql', actionType: 'created' },
  { promptId: 'prompt-071', filePath: 'scripts/backfill_status.sql', actionType: 'created' },
  { promptId: 'prompt-072', filePath: 'migrations/20260328_add_indexes.sql', actionType: 'created' },
  { promptId: 'prompt-073', filePath: 'migrations/20260328_rollback.sql', actionType: 'created' },
  // Session 015 - Push notifications
  { promptId: 'prompt-074', filePath: 'src/services/push-notifications.ts', actionType: 'created' },
  { promptId: 'prompt-074', filePath: 'src/config/firebase.ts', actionType: 'created' },
  { promptId: 'prompt-075', filePath: 'src/screens/NotificationPreferences.tsx', actionType: 'created' },
  { promptId: 'prompt-076', filePath: 'src/services/notification.service.ts', actionType: 'created' },
  { promptId: 'prompt-076', filePath: 'src/routes/notifications.ts', actionType: 'created' },
  { promptId: 'prompt-077', filePath: 'src/navigation/notification-handler.ts', actionType: 'created' },
  { promptId: 'prompt-077', filePath: 'src/navigation/RootNavigator.tsx', actionType: 'modified' },
  { promptId: 'prompt-078', filePath: 'src/services/badge-manager.ts', actionType: 'created' },
  // Session 016 - Deploy fixes
  { promptId: 'prompt-079', filePath: 'next.config.js', actionType: 'modified' },
  { promptId: 'prompt-079', filePath: 'package.json', actionType: 'modified' },
  { promptId: 'prompt-080', filePath: 'vercel.json', actionType: 'modified' },
  { promptId: 'prompt-080', filePath: '.github/workflows/preview.yml', actionType: 'created' },
  { promptId: 'prompt-081', filePath: 'src/env.ts', actionType: 'created' },
  { promptId: 'prompt-082', filePath: 'docs/nextjs-patterns.md', actionType: 'read' },
  { promptId: 'prompt-095', filePath: 'next.config.js', actionType: 'modified' },
  { promptId: 'prompt-095', filePath: 'src/components/ProductImage.tsx', actionType: 'modified' },
  // Session 017 - Imported
  { promptId: 'prompt-083', filePath: 'turbo.json', actionType: 'created' },
  { promptId: 'prompt-083', filePath: 'package.json', actionType: 'modified' },
  { promptId: 'prompt-084', filePath: 'packages/config/eslint/index.js', actionType: 'created' },
  { promptId: 'prompt-085', filePath: '.changeset/config.json', actionType: 'created' },
];

let fileCounter = 0;
export const demoPromptFiles: PromptFile[] = fileSeeds.map((f) => {
  fileCounter++;
  const prompt = demoPrompts.find((p) => p.id === f.promptId);
  return {
    id: `pf-${String(fileCounter).padStart(3, '0')}`,
    promptId: f.promptId,
    filePath: f.filePath,
    actionType: f.actionType,
    createdAt: prompt?.timestamp ?? NOW,
  };
});

// ---------------------------------------------------------------------------
// Prompt Tags  (290+ entries with semantically-correct per-prompt tags)
// ---------------------------------------------------------------------------

interface TagSeed { promptId: string; tags: string[] }

const tagSeeds: TagSeed[] = [
  { promptId: 'prompt-001', tags: ['auth', 'jwt', 'refactor', 'typescript'] },
  { promptId: 'prompt-002', tags: ['auth', 'jwt', 'debugging'] },
  { promptId: 'prompt-003', tags: ['typescript', 'auth', 'refactor'] },
  { promptId: 'prompt-004', tags: ['testing', 'auth', 'jest'] },
  { promptId: 'prompt-005', tags: ['auth', 'redis', 'architecture'] },
  { promptId: 'prompt-006', tags: ['redis', 'auth', 'typescript'] },
  { promptId: 'prompt-007', tags: ['auth', 'api'] },
  { promptId: 'prompt-008', tags: ['api', 'performance', 'database', 'pagination'] },
  { promptId: 'prompt-009', tags: ['api', 'pagination', 'debugging'] },
  { promptId: 'prompt-010', tags: ['api', 'typescript', 'pagination'] },
  { promptId: 'prompt-011', tags: ['testing', 'api', 'integration'] },
  { promptId: 'prompt-012', tags: ['performance', 'database', 'redis'] },
  { promptId: 'prompt-013', tags: ['api', 'redis', 'rate-limiting'] },
  { promptId: 'prompt-014', tags: ['react', 'hooks', 'debugging', 'performance'] },
  { promptId: 'prompt-015', tags: ['react', 'performance', 'memoization'] },
  { promptId: 'prompt-016', tags: ['react', 'hooks', 'typescript'] },
  { promptId: 'prompt-017', tags: ['react', 'performance', 'react-native'] },
  { promptId: 'prompt-018', tags: ['react', 'react-native', 'hooks'] },
  { promptId: 'prompt-019', tags: ['react', 'hooks'] },
  { promptId: 'prompt-020', tags: ['graphql', 'api', 'refactor', 'typescript'] },
  { promptId: 'prompt-021', tags: ['graphql', 'performance', 'database'] },
  { promptId: 'prompt-022', tags: ['graphql', 'api', 'typescript'] },
  { promptId: 'prompt-023', tags: ['graphql', 'typescript', 'codegen'] },
  { promptId: 'prompt-024', tags: ['graphql', 'api', 'validation'] },
  { promptId: 'prompt-025', tags: ['react', 'typescript', 'architecture'] },
  { promptId: 'prompt-026', tags: ['react', 'ui', 'typescript', 'css'] },
  { promptId: 'prompt-027', tags: ['react', 'ui', 'accessibility'] },
  { promptId: 'prompt-028', tags: ['react', 'testing', 'storybook'] },
  { promptId: 'prompt-029', tags: ['css', 'ui', 'design-tokens'] },
  { promptId: 'prompt-030', tags: ['architecture', 'database', 'aws'] },
  { promptId: 'prompt-031', tags: ['python', 'validation', 'database'] },
  { promptId: 'prompt-032', tags: ['database', 'sql', 'deduplication'] },
  { promptId: 'prompt-033', tags: ['database', 'sql', 'monitoring'] },
  { promptId: 'prompt-034', tags: ['aws', 'architecture', 'error-handling'] },
  { promptId: 'prompt-035', tags: ['testing', 'jest', 'typescript'] },
  { promptId: 'prompt-036', tags: ['testing', 'database', 'typescript'] },
  { promptId: 'prompt-037', tags: ['testing', 'performance', 'jest'] },
  { promptId: 'prompt-038', tags: ['deployment', 'ci-cd', 'github-actions'] },
  { promptId: 'prompt-039', tags: ['testing', 'ci-cd', 'deployment'] },
  { promptId: 'prompt-040', tags: ['database', 'debugging', 'performance'] },
  { promptId: 'prompt-041', tags: ['database', 'debugging', 'typescript'] },
  { promptId: 'prompt-042', tags: ['docker', 'database', 'deployment'] },
  { promptId: 'prompt-043', tags: ['api', 'monitoring', 'database'] },
  { promptId: 'prompt-044', tags: ['react-native', 'navigation', 'refactor'] },
  { promptId: 'prompt-045', tags: ['react-native', 'typescript', 'navigation'] },
  { promptId: 'prompt-046', tags: ['react-native', 'navigation', 'deep-linking'] },
  { promptId: 'prompt-047', tags: ['react-native', 'css', 'debugging'] },
  { promptId: 'prompt-048', tags: ['react-native', 'animation', 'ui'] },
  { promptId: 'prompt-049', tags: ['react-native', 'hooks', 'analytics'] },
  { promptId: 'prompt-050', tags: ['css', 'ui', 'dark-mode'] },
  { promptId: 'prompt-051', tags: ['react', 'hooks', 'css', 'dark-mode'] },
  { promptId: 'prompt-052', tags: ['refactor', 'css', 'dark-mode'] },
  { promptId: 'prompt-053', tags: ['css', 'animation', 'dark-mode'] },
  { promptId: 'prompt-054', tags: ['testing', 'playwright', 'css'] },
  { promptId: 'prompt-055', tags: ['nodejs', 'streaming', 'typescript'] },
  { promptId: 'prompt-056', tags: ['kafka', 'streaming', 'typescript'] },
  { promptId: 'prompt-057', tags: ['kafka', 'architecture'] },
  { promptId: 'prompt-058', tags: ['docker', 'deployment', 'nodejs'] },
  { promptId: 'prompt-059', tags: ['logging', 'nodejs', 'typescript'] },
  { promptId: 'prompt-060', tags: ['testing', 'playwright', 'nextjs'] },
  { promptId: 'prompt-061', tags: ['testing', 'playwright', 'e2e'] },
  { promptId: 'prompt-062', tags: ['testing', 'playwright', 'typescript'] },
  { promptId: 'prompt-063', tags: ['testing', 'api', 'mocking'] },
  { promptId: 'prompt-064', tags: ['testing', 'debugging', 'ci-cd'] },
  { promptId: 'prompt-065', tags: ['redis', 'api', 'rate-limiting'] },
  { promptId: 'prompt-066', tags: ['redis', 'api', 'caching'] },
  { promptId: 'prompt-067', tags: ['redis', 'performance', 'monitoring'] },
  { promptId: 'prompt-068', tags: ['testing', 'performance', 'api'] },
  { promptId: 'prompt-069', tags: ['redis', 'architecture'] },
  { promptId: 'prompt-070', tags: ['database', 'sql', 'migration'] },
  { promptId: 'prompt-071', tags: ['database', 'sql', 'migration'] },
  { promptId: 'prompt-072', tags: ['database', 'sql', 'performance'] },
  { promptId: 'prompt-073', tags: ['database', 'sql', 'migration'] },
  { promptId: 'prompt-074', tags: ['react-native', 'firebase', 'notifications'] },
  { promptId: 'prompt-075', tags: ['react-native', 'ui', 'notifications'] },
  { promptId: 'prompt-076', tags: ['api', 'firebase', 'notifications'] },
  { promptId: 'prompt-077', tags: ['react-native', 'navigation', 'notifications'] },
  { promptId: 'prompt-078', tags: ['react-native', 'notifications'] },
  { promptId: 'prompt-079', tags: ['nextjs', 'deployment', 'debugging'] },
  { promptId: 'prompt-080', tags: ['deployment', 'vercel', 'ci-cd'] },
  { promptId: 'prompt-081', tags: ['typescript', 'validation', 'nextjs'] },
  { promptId: 'prompt-082', tags: ['nextjs', 'react', 'architecture'] },
  { promptId: 'prompt-083', tags: ['architecture', 'monorepo', 'nextjs'] },
  { promptId: 'prompt-084', tags: ['eslint', 'typescript', 'monorepo'] },
  { promptId: 'prompt-085', tags: ['deployment', 'monorepo', 'versioning'] },
  { promptId: 'prompt-086', tags: ['react', 'hooks', 'typescript', 'validation'] },
  { promptId: 'prompt-087', tags: ['react-native', 'ui', 'css', 'animation'] },
  { promptId: 'prompt-088', tags: ['database', 'sql', 'performance'] },
  { promptId: 'prompt-089', tags: ['api', 'logging', 'typescript'] },
  { promptId: 'prompt-090', tags: ['css', 'ui', 'accessibility'] },
  { promptId: 'prompt-091', tags: ['react', 'error-handling', 'monitoring'] },
  { promptId: 'prompt-092', tags: ['api', 'documentation', 'typescript'] },
  { promptId: 'prompt-093', tags: ['react', 'ui', 'accessibility', 'typescript'] },
  { promptId: 'prompt-094', tags: ['python', 'testing', 'database'] },
  { promptId: 'prompt-095', tags: ['nextjs', 'performance', 'images'] },
];

let tagCounter = 0;
export const demoPromptTags: PromptTag[] = tagSeeds.flatMap((ts) =>
  ts.tags.map((tag) => {
    tagCounter++;
    return {
      id: `pt-${String(tagCounter).padStart(3, '0')}`,
      promptId: ts.promptId,
      tag,
    };
  })
);

// ---------------------------------------------------------------------------
// Template Candidates (12 entries)
// ---------------------------------------------------------------------------
export const demoTemplates: TemplateCandidate[] = [
  { id: 'tmpl-001', title: 'Write unit tests for [Service] covering edge cases', normalizedPattern: 'Write unit tests for {service} covering edge cases for {feature}', description: 'Pattern for requesting unit test generation for service classes with specific edge case coverage.', sourcePromptIdsJson: JSON.stringify(['prompt-004', 'prompt-035']), reuseScore: 0.88, category: 'testing', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-002', title: 'Create reusable [Component] with variants', normalizedPattern: 'Create a {component} component with variants: {variants}. Sizes: {sizes}.', description: 'Pattern for generating React components with variant and size props using cva.', sourcePromptIdsJson: JSON.stringify(['prompt-026', 'prompt-027']), reuseScore: 0.92, category: 'code-generation', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-003', title: 'Fix N+1 query problem with DataLoader', normalizedPattern: 'The {resolver} resolver is doing N+1 queries. Set up DataLoader for batch loading.', description: 'Pattern for solving GraphQL N+1 query problems using DataLoader batching.', sourcePromptIdsJson: JSON.stringify(['prompt-021']), reuseScore: 0.85, category: 'performance', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-004', title: 'Set up CI/CD pipeline with [Stages]', normalizedPattern: 'Set up {provider} CI/CD pipeline with {stages} stages', description: 'Pattern for setting up continuous integration and deployment pipelines.', sourcePromptIdsJson: JSON.stringify(['prompt-038', 'prompt-039']), reuseScore: 0.88, category: 'deployment', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-005', title: 'Implement rate limiting with Redis', normalizedPattern: 'Implement a {algorithm} rate limiter using Redis. Need {limits} with {response}.', description: 'Pattern for implementing API rate limiting with Redis-backed stores.', sourcePromptIdsJson: JSON.stringify(['prompt-013', 'prompt-065']), reuseScore: 0.85, category: 'code-generation', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-006', title: 'Create a reusable React hook', normalizedPattern: 'Create a reusable {hookName} hook that supports {features}', description: 'Pattern for generating custom React hooks with specific functionality.', sourcePromptIdsJson: JSON.stringify(['prompt-016', 'prompt-051', 'prompt-086']), reuseScore: 0.95, category: 'code-generation', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-007', title: 'Add cursor-based pagination', normalizedPattern: 'Add cursor-based pagination to {endpoint} with {pageSize} default page size', description: 'Pattern for implementing efficient cursor-based pagination for API endpoints.', sourcePromptIdsJson: JSON.stringify(['prompt-008', 'prompt-009', 'prompt-010']), reuseScore: 0.90, category: 'code-generation', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-008', title: 'Write E2E test for [Flow]', normalizedPattern: 'Write an E2E test for the complete {flow} flow: {steps}', description: 'Pattern for generating end-to-end Playwright tests for user flows.', sourcePromptIdsJson: JSON.stringify(['prompt-061', 'prompt-062']), reuseScore: 0.82, category: 'testing', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-009', title: 'Write a Dockerfile for [Service]', normalizedPattern: 'Write a Dockerfile for {service}. Multi-stage build, non-root user, health check.', description: 'Pattern for generating production-ready Dockerfiles with best practices.', sourcePromptIdsJson: JSON.stringify(['prompt-058']), reuseScore: 0.80, category: 'deployment', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-010', title: 'Create database migration for [Change]', normalizedPattern: 'Create a database migration to {change}. Must be backwards compatible.', description: 'Pattern for generating safe, backwards-compatible database migrations.', sourcePromptIdsJson: JSON.stringify(['prompt-070', 'prompt-071', 'prompt-072']), reuseScore: 0.78, category: 'data-backend', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-011', title: 'Explain the difference between [A] and [B]', normalizedPattern: 'Explain the difference between {conceptA} and {conceptB} and when to use each', description: 'Pattern for requesting concept comparisons and usage guidance.', sourcePromptIdsJson: JSON.stringify(['prompt-019', 'prompt-057', 'prompt-082']), reuseScore: 0.45, category: 'exploratory', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'tmpl-012', title: 'Add proper TypeScript types to [Module]', normalizedPattern: 'Add proper TypeScript types to {module}, the any types are causing issues', description: 'Pattern for adding type safety to loosely typed modules.', sourcePromptIdsJson: JSON.stringify(['prompt-003', 'prompt-045']), reuseScore: 0.82, category: 'refactor', createdAt: ago(10), updatedAt: ago(10) },
];

// ---------------------------------------------------------------------------
// Aggregate stats helper
// ---------------------------------------------------------------------------
export function getDemoStats() {
  const categoryMap: Record<string, number> = {};
  const modelMap: Record<string, number> = {};
  const dayMap: Record<string, number> = {};
  let totalTokens = 0;
  let totalCost = 0;
  let successSum = 0;
  let reuseSum = 0;

  for (const p of demoPrompts) {
    const cat = p.category || 'unknown';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    if (p.model) modelMap[p.model] = (modelMap[p.model] || 0) + 1;
    const day = new Date(p.timestamp ?? 0).toISOString().slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;
    totalTokens += p.tokenEstimate || 0;
    totalCost += p.costEstimate || 0;
    successSum += p.successScore || 0;
    reuseSum += p.reuseScore || 0;
  }

  return {
    totalPrompts: demoPrompts.length,
    totalSessions: demoSessions.length,
    totalProjects: demoProjects.length,
    totalSources: demoSources.filter((s) => s.enabled).length,
    totalTokens,
    totalCost: Math.round(totalCost * 100) / 100,
    avgSuccessScore: Math.round((successSum / demoPrompts.length) * 100) / 100,
    avgReuseScore: Math.round((reuseSum / demoPrompts.length) * 100) / 100,
    promptsByCategory: categoryMap as Record<PromptCategory, number>,
    promptsByModel: modelMap,
    promptsByDay: Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topProjects: demoProjects.map((p) => ({
      id: p.id,
      name: p.name,
      promptCount: demoPrompts.filter((pr) => pr.projectId === p.id).length,
    })).sort((a, b) => b.promptCount - a.promptCount),
    recentPrompts: demoPrompts
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, 10),
  };
}
