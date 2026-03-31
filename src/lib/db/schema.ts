import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // SourceType
  enabled: integer('enabled').notNull().default(1),
  status: text('status').notNull().default('idle'),
  lastScannedAt: integer('last_scanned_at'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  sessions: many(sessions),
  prompts: many(prompts),
}));

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  firstSeenAt: integer('first_seen_at'),
  lastSeenAt: integer('last_seen_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  sessions: many(sessions),
  prompts: many(prompts),
}));

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => sources.id),
  projectId: text('project_id').references(() => projects.id),
  externalSessionId: text('external_session_id'),
  title: text('title'),
  startedAt: integer('started_at'),
  endedAt: integer('ended_at'),
  promptCount: integer('prompt_count').notNull().default(0),
  modelSummaryJson: text('model_summary_json'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  source: one(sources, {
    fields: [sessions.sourceId],
    references: [sources.id],
  }),
  project: one(projects, {
    fields: [sessions.projectId],
    references: [projects.id],
  }),
  prompts: many(prompts),
}));

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').references(() => sources.id),
  projectId: text('project_id').references(() => projects.id),
  sessionId: text('session_id').references(() => sessions.id),
  timestamp: integer('timestamp'),
  promptText: text('prompt_text'),
  responsePreview: text('response_preview'),
  model: text('model'),
  promptLength: integer('prompt_length'),
  category: text('category'),
  intent: text('intent'),
  tokenEstimate: integer('token_estimate'),
  costEstimate: real('cost_estimate'),
  successScore: real('success_score'),
  reuseScore: real('reuse_score'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  source: one(sources, {
    fields: [prompts.sourceId],
    references: [sources.id],
  }),
  project: one(projects, {
    fields: [prompts.projectId],
    references: [projects.id],
  }),
  session: one(sessions, {
    fields: [prompts.sessionId],
    references: [sessions.id],
  }),
  files: many(promptFiles),
  tags: many(promptTags),
}));

// ---------------------------------------------------------------------------
// Prompt Files
// ---------------------------------------------------------------------------
export const promptFiles = sqliteTable('prompt_files', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id')
    .notNull()
    .references(() => prompts.id),
  filePath: text('file_path').notNull(),
  actionType: text('action_type'),
  createdAt: integer('created_at').notNull(),
});

export const promptFilesRelations = relations(promptFiles, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptFiles.promptId],
    references: [prompts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Prompt Tags
// ---------------------------------------------------------------------------
export const promptTags = sqliteTable('prompt_tags', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id')
    .notNull()
    .references(() => prompts.id),
  tag: text('tag').notNull(),
});

export const promptTagsRelations = relations(promptTags, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptTags.promptId],
    references: [prompts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Template Candidates
// ---------------------------------------------------------------------------
export const templateCandidates = sqliteTable('template_candidates', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  normalizedPattern: text('normalized_pattern'),
  description: text('description'),
  sourcePromptIdsJson: text('source_prompt_ids_json'),
  reuseScore: real('reuse_score'),
  category: text('category'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
