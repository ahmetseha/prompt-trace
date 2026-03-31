# Local Development

## Prerequisites

- **Node.js** 18 or later (check with `node --version`)
- **npm** 9 or later (ships with Node.js)
- No other dependencies required. SQLite is embedded via better-sqlite3.

## Installation

```bash
git clone https://github.com/user/prompttrace.git
cd prompttrace
npm install
```

## Database Setup

PromptTrace uses a local SQLite database stored at `data/prompttrace.db`. The database file is created automatically when you first run the seed or push command.

### Seed with Demo Data

The seed script populates the database with realistic demo data so you can explore the full UI immediately:

```bash
npm run db:seed
```

This creates demo sources, projects, sessions, prompts, files, tags, and template candidates. The seed script is idempotent and can be re-run safely.

### Schema Management

Drizzle ORM handles schema management. The schema is defined in `src/lib/db/schema.ts`.

```bash
# Push schema changes directly to the database (development only)
npm run db:push

# Generate migration files from schema changes
npm run db:generate

# Run pending migrations
npm run db:migrate
```

### Database Browser

Drizzle Studio provides a web-based database browser:

```bash
npm run db:studio
```

This opens a browser UI where you can inspect tables, run queries, and edit records.

## Development Server

```bash
npm run dev
```

This starts the Next.js development server with Turbopack at [http://localhost:3000](http://localhost:3000). The server supports hot module replacement for fast iteration.

## Project Structure

```
prompttrace/
  data/                     # SQLite database file (gitignored)
  docs/                     # Project documentation
  drizzle/                  # Generated migration files
  public/                   # Static assets
  scripts/
    seed.ts                 # Database seed script
  src/
    app/                    # Next.js App Router
      api/                  # REST API routes
        prompts/            # GET /api/prompts, GET /api/prompts/:id
        sessions/           # GET /api/sessions, GET /api/sessions/:id
        projects/           # GET /api/projects, GET /api/projects/:id
        sources/            # GET /api/sources
        templates/          # GET /api/templates
        search/             # GET /api/search
        stats/              # GET /api/stats
      dashboard/            # Dashboard pages
        page.tsx            # Overview dashboard
        prompts/            # Prompt explorer
        sessions/           # Session list and detail
        projects/           # Project list and detail
        sources/            # Source management
        templates/          # Template candidates
        settings/           # Settings page
        layout.tsx          # Dashboard shell (sidebar + top bar)
      page.tsx              # Landing page
      layout.tsx            # Root layout
      globals.css           # Theme tokens and global styles
    components/             # Shared components
      ui/                   # Base primitives (button, card, badge, etc.)
    features/               # Feature-specific components
      dashboard/            # Charts and dashboard widgets
      prompts/              # Prompt explorer components
      sessions/             # Session timeline components
      sources/              # Source cards
      templates/            # Template cards
      landing/              # Landing page components
      projects/             # Project stats components
    lib/
      adapters/             # Source adapters
      classification/       # Category and intent classifiers
      db/                   # Database schema, connection, queries
      demo/                 # Demo data generators
      scoring/              # Reuse and success score calculators
      search/               # Fuse.js search configuration
      types/                # TypeScript type definitions
      utils/                # Utility functions (cn, etc.)
  drizzle.config.ts         # Drizzle ORM configuration
  next.config.ts            # Next.js configuration
  tsconfig.json             # TypeScript configuration
  package.json              # Dependencies and scripts
```

## Common Tasks

### Adding a New API Route

Create a `route.ts` file under `src/app/api/<resource>/`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(prompts).limit(50);
  return NextResponse.json(data);
}
```

### Adding a New Dashboard Page

Create a `page.tsx` file under `src/app/dashboard/<page-name>/`:

```typescript
export default function NewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Page Title</h1>
    </div>
  );
}
```

The page is automatically available at `/dashboard/<page-name>` and can be added to the sidebar in `src/components/app-sidebar.tsx`.

### Adding a New Feature Component

Create a file in `src/features/<feature>/`:

```typescript
"use client";

export function MyWidget({ data }: { data: SomeType[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      {/* component content */}
    </div>
  );
}
```

### Modifying the Database Schema

1. Edit `src/lib/db/schema.ts`.
2. Run `npm run db:push` to apply changes immediately (development).
3. Or run `npm run db:generate` followed by `npm run db:migrate` for tracked migrations.

## Environment

No environment variables are required. The application uses sensible defaults:

- Database path: `./data/prompttrace.db` (configured in `drizzle.config.ts`)
- Dev server port: 3000 (Next.js default)

## Troubleshooting

**Database file not found:** Run `npm run db:seed` or `npm run db:push` to create it.

**Port 3000 already in use:** Stop the other process or start with `npm run dev -- --port 3001`.

**better-sqlite3 build errors:** Ensure you have Node.js 18+ and that native build tools are available. On macOS, Xcode Command Line Tools are required (`xcode-select --install`).

**Empty dashboard:** Run `npm run db:seed` to populate demo data.
