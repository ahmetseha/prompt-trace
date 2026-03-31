# PromptTrace

**Local-first prompt intelligence for developers.**

PromptTrace scans your AI coding assistant histories -- Cursor, Claude Code, Copilot, Gemini CLI, and Codex CLI -- and transforms them into a structured prompt intelligence dashboard. All data stays on your machine; nothing leaves your local environment.

![PromptTrace Dashboard](docs/screenshots/dashboard.png)

## Features

- **Multi-source scanning** -- Ingests prompt history from Cursor, Claude Code, and other AI coding tools through a pluggable adapter system.
- **Automatic classification** -- Categorizes every prompt by domain (bug-fixing, refactoring, code-generation, testing, and more) and intent (ask, instruct, generate, fix, explain, plan, compare, transform).
- **Reuse scoring** -- Identifies high-value, template-worthy prompts based on structure, specificity, and action orientation.
- **Success scoring** -- Estimates prompt effectiveness using heuristic signals like response length, file changes, and prompt clarity.
- **Full-text search** -- Fuzzy search across all prompts with weighted fields powered by Fuse.js.
- **Session timeline** -- Groups prompts into sessions and visualizes your workflow chronologically.
- **Project-level analytics** -- Tracks prompt patterns per project with per-project dashboards.
- **Template candidates** -- Surfaces reusable prompt patterns that can be extracted into templates.
- **Interactive dashboard** -- Charts for activity over time, category distribution, model usage, and source breakdown.
- **Privacy by design** -- All data stored in a local SQLite database. No network requests, no telemetry, no cloud sync.

## Quick Start

```bash
git clone https://github.com/user/prompttrace.git
cd prompttrace
npm install
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The seed command populates the database with realistic demo data so you can explore the dashboard immediately.

## Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack) |
| Language      | TypeScript 6                        |
| Styling       | Tailwind CSS 4                      |
| Database      | SQLite via better-sqlite3           |
| ORM           | Drizzle ORM                         |
| Search        | Fuse.js                             |
| Charts        | Recharts                            |
| State         | Zustand, TanStack React Query       |
| UI primitives | Radix UI (via shadcn/ui components) |
| Validation    | Zod                                 |
| Animation     | Framer Motion                       |

## Folder Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/                  # REST API endpoints
    dashboard/            # Dashboard pages (overview, prompts, sessions, etc.)
  components/             # Shared UI components
    ui/                   # Base UI primitives (button, card, badge, etc.)
  features/               # Feature-specific components
    dashboard/            # Dashboard charts and widgets
    prompts/              # Prompt explorer and filters
    sessions/             # Session timeline and cards
    sources/              # Source management cards
    templates/            # Template candidate cards
  lib/
    adapters/             # Source adapters (Cursor, Claude Code, etc.)
    classification/       # Category and intent classifiers
    db/                   # Drizzle schema, queries, migrations
    demo/                 # Demo/seed data generators
    scoring/              # Reuse and success score calculators
    search/               # Fuse.js search configuration
    types/                # Shared TypeScript types
    utils/                # Utility functions
scripts/                  # Database seeding and maintenance scripts
data/                     # SQLite database file (gitignored)
```

## Supported Sources

| Source      | Status      | Description                                      |
| ----------- | ----------- | ------------------------------------------------ |
| Cursor      | Placeholder | Reads from Cursor workspace storage              |
| Claude Code | Placeholder | Parses Claude Code JSONL conversation logs        |
| Copilot     | Planned     | GitHub Copilot Chat history                       |
| Gemini CLI  | Planned     | Google Gemini CLI conversation logs               |
| Codex CLI   | Planned     | OpenAI Codex CLI history                          |
| JSON import | Planned     | Manual import via structured JSON files            |
| Markdown    | Planned     | Manual import via Markdown conversation exports    |

## Privacy

PromptTrace is local-first by design. Your prompt data never leaves your machine. The application runs entirely on localhost, stores data in a local SQLite file at `data/prompttrace.db`, and makes no outbound network requests. There is no telemetry, no analytics, and no cloud component.

## Documentation

- [Product Overview](docs/product-overview.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md)
- [Parsing Adapters](docs/parsing-adapters.md)
- [Design System](docs/design-system.md)
- [Local Development](docs/local-development.md)
- [Roadmap](docs/roadmap.md)
- [Contributing](docs/contributing.md)

## Roadmap

See the full [Roadmap](docs/roadmap.md) for planned features and milestones.

## Contributing

See the [Contributing Guide](docs/contributing.md) for setup instructions, code style, and the PR process.

## License

MIT
