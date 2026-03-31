# Architecture

## Overview

PromptTrace is a single-user, local-first web application. It runs as a Next.js development server on localhost, stores all data in a local SQLite database, and has no external service dependencies.

```
+-----------+     +----------+     +---------+     +----------+     +--------+
|  AI Tool  | --> | Adapter  | --> | Parser  | --> | Classify | --> | SQLite |
|  History  |     | (detect, |     | & Norm. |     | & Score  |     |  (via  |
|  Files    |     |  parse)  |     |         |     |          |     |Drizzle)|
+-----------+     +----------+     +---------+     +----------+     +--------+
                                                                        |
                                                                        v
                                                                  +-----------+
                                                                  | Next.js   |
                                                                  | App Router|
                                                                  | (API +UI) |
                                                                  +-----------+
```

## System Architecture

### Local SQLite Database

The database is a single SQLite file at `data/prompttrace.db`, accessed via better-sqlite3 (synchronous, no connection pool needed). Drizzle ORM provides the schema definition, query builder, and migration tooling.

This approach was chosen because:

- Zero configuration -- no database server to install or manage.
- Single-file portability -- the entire dataset is one file.
- Performance -- SQLite handles the expected data volume (tens of thousands of prompts) with ease.
- Privacy -- data never touches a network.

### Next.js App Router

The application uses Next.js App Router with server components as the default. API routes handle data operations; page components handle rendering.

- **Server components** load data directly via Drizzle queries on the server.
- **Client components** (marked `"use client"`) handle interactivity: filters, charts, search, command palette.
- **API routes** under `src/app/api/` provide REST endpoints for client-side data fetching via TanStack React Query.

### Adapter Pattern

Each AI coding tool is supported through a `SourceAdapter` implementation. Adapters are responsible for:

1. **Detection** -- determining whether the tool is installed on the current machine.
2. **Path resolution** -- locating the tool's history files.
3. **Parsing** -- reading and extracting prompt data from tool-specific formats.
4. **Health checking** -- reporting the adapter's operational status.

This pattern isolates all source-specific logic behind a uniform interface, making it straightforward to add new sources.

## Data Flow

### Ingestion Pipeline

```
1. Source Detection
   Adapter.detect() checks if the AI tool's data directory exists.

2. Path Resolution
   Adapter.getDefaultPath() returns the platform-specific path to history files.

3. Parsing
   Adapter.parse(basePath) reads raw history files and returns ParsedPrompt[].

4. Normalization
   ParsedPrompt data is mapped to the database schema (prompts, sessions, projects).

5. Classification
   classifyCategory(text) and classifyIntent(text) assign category and intent labels.

6. Scoring
   calculateReuseScore() and calculateSuccessScore() compute numeric scores.

7. Storage
   Normalized, classified, scored records are inserted into SQLite via Drizzle.
```

### Query Pipeline

```
1. API Route receives request with filters (category, intent, time range, search query, etc.)
2. Drizzle query builder constructs SQL with dynamic WHERE clauses.
3. For search: Fuse.js performs fuzzy matching on the result set.
4. Response is returned as JSON to the client.
5. TanStack React Query caches the response and provides loading/error states.
6. React components render the data with Recharts (charts) or custom UI.
```

## Key Modules

### Adapters (`src/lib/adapters/`)

- `types.ts` -- `SourceAdapter`, `ParsedPrompt`, and `AdapterHealth` interfaces.
- `cursor.ts` -- Cursor adapter (placeholder; detects Cursor workspace storage).
- `claude-code.ts` -- Claude Code adapter (placeholder; detects `~/.claude` directory).
- `index.ts` -- Adapter registry with `getAdapter()` and `getAllAdapters()` functions.

### Classification Engine (`src/lib/classification/`)

- `categories.ts` -- Weighted keyword rules for 13 prompt categories. Each rule has a keyword list and optional regex patterns with bonus scoring.
- `intents.ts` -- Priority-ordered rules for 8 intent types. Rules are evaluated by priority; the first strong match wins.
- `index.ts` -- Unified `classifyPrompt()` function returning both category and intent.

### Scoring System (`src/lib/scoring/`)

- `reuse.ts` -- Reuse score (0--100) based on length, action verbs, intent type, project-specific references, structural patterns, and code block density.
- `success.ts` -- Success score (0--100) based on file changes, response length, prompt clarity patterns, action intent, and prompt length.
- `index.ts` -- Unified `scorePrompt()` function returning both scores.

### Search (`src/lib/search/`)

- `index.ts` -- Fuse.js configuration with weighted keys (promptText: 0.5, category: 0.2, model: 0.15, tags: 0.15). Provides `createPromptSearch()` for reusable index and `searchPrompts()` for one-shot search.

### Database (`src/lib/db/`)

- `schema.ts` -- Drizzle ORM table definitions and relations.
- `queries.ts` -- Reusable query functions.
- `index.ts` -- Database connection initialization.
- `migrate.ts` -- Migration runner.

### Demo Data (`src/lib/demo/`)

- `data.ts` -- Generates realistic demo prompts, sessions, projects, and sources for development and testing.
- `index.ts` -- Export helpers.

## Database Design

See [Data Model](data-model.md) for full table definitions.

The schema uses seven tables with foreign key relationships:

```
sources ---< sessions ---< prompts >--- projects
                              |
                              +---< prompt_files
                              +---< prompt_tags

template_candidates (standalone)
```

All timestamps are stored as Unix epoch integers. JSON data (metadata, model summaries) is stored as serialized text columns.

## API Route Structure

```
src/app/api/
  stats/route.ts          GET    -- Dashboard aggregate statistics
  prompts/route.ts        GET    -- List prompts with filters and pagination
  prompts/[id]/route.ts   GET    -- Single prompt detail
  sessions/route.ts       GET    -- List sessions
  sessions/[id]/route.ts  GET    -- Single session with prompts
  projects/route.ts       GET    -- List projects
  projects/[id]/route.ts  GET    -- Single project detail
  sources/route.ts        GET    -- List configured sources with health
  templates/route.ts      GET    -- List template candidates
  search/route.ts         GET    -- Full-text search across prompts
```

## Frontend Structure

The frontend follows a features-based organization pattern:

```
src/
  app/dashboard/
    page.tsx              -- Overview dashboard with charts and stats
    prompts/page.tsx      -- Prompt explorer with filters
    prompts/[id]/page.tsx -- Prompt detail view
    sessions/page.tsx     -- Session list
    sessions/[id]/page.tsx-- Session timeline view
    projects/page.tsx     -- Project list
    projects/[id]/page.tsx-- Project detail
    sources/page.tsx      -- Source management
    templates/page.tsx    -- Template candidates
    settings/page.tsx     -- Settings
    layout.tsx            -- Dashboard shell with sidebar

  features/
    dashboard/            -- Activity chart, category chart, model chart, etc.
    prompts/              -- Prompt list item, filters, explorer
    sessions/             -- Session card, timeline
    sources/              -- Source card
    templates/            -- Template card

  components/
    ui/                   -- Base primitives (button, card, badge, dialog, etc.)
    app-sidebar.tsx       -- Navigation sidebar
    top-bar.tsx           -- Top navigation bar
    command-palette.tsx   -- Cmd+K search palette
    stats-card.tsx        -- Metric display card
    chart-card.tsx        -- Chart container wrapper
    category-badge.tsx    -- Colored category label
    source-icon.tsx       -- Source type icon
    empty-state.tsx       -- Empty state placeholder
```

State management uses Zustand for client-side filter state and TanStack React Query for server state and caching.
