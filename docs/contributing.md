# Contributing

Contributions to PromptTrace are welcome. This document covers the development setup, code conventions, and pull request process.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- Git

### Setup

```bash
git clone https://github.com/ahmetseha/prompt-trace.git
cd prompttrace
npm install
npm run db:seed
npm run dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000) with Turbopack for fast refresh.

### Useful Commands

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start development server with Turbopack          |
| `npm run build`      | Production build                                 |
| `npm run lint`       | Run ESLint                                       |
| `npm run db:seed`    | Seed the database with demo data                 |
| `npm run db:generate`| Generate Drizzle migration files                 |
| `npm run db:migrate` | Run pending migrations                           |
| `npm run db:push`    | Push schema changes directly (development only)  |
| `npm run db:studio`  | Open Drizzle Studio database browser             |

## Code Style

### General

- TypeScript strict mode. No `any` types unless absolutely necessary.
- Use named exports. Avoid default exports except for Next.js pages.
- Prefer `const` over `let`. Never use `var`.
- Use template literals for string interpolation.

### File Organization

- **Pages** go in `src/app/` following Next.js App Router conventions.
- **Feature components** go in `src/features/<feature-name>/`.
- **Shared components** go in `src/components/`.
- **Base UI primitives** go in `src/components/ui/`.
- **Library code** goes in `src/lib/<module>/` with an `index.ts` barrel export.

### Naming Conventions

- Files: `kebab-case.ts` or `kebab-case.tsx`.
- Components: `PascalCase` function names.
- Types/interfaces: `PascalCase`.
- Variables and functions: `camelCase`.
- Database columns: `snake_case` (Drizzle maps to camelCase in TypeScript).

### Styling

- Use Tailwind CSS utility classes. Avoid custom CSS unless necessary.
- Follow the design system color tokens defined in `globals.css`.
- Use the `cn()` utility from `src/lib/utils` for conditional class merging.

### Components

- Prefer server components (the default in App Router).
- Mark client components with `"use client"` only when they need interactivity.
- Use Radix UI primitives (via shadcn/ui) for accessible interactive components.

## Pull Request Process

### Before You Start

1. Check existing issues and PRs to avoid duplicate work.
2. For significant changes, open an issue first to discuss the approach.

### Branch Naming

Use descriptive branch names:

```
feature/cursor-adapter-parsing
fix/search-index-rebuild
docs/update-architecture
```

### Commit Messages

Write clear, descriptive commit messages:

```
Add Cursor adapter workspace storage parsing

Implement the parse() method for the Cursor adapter. Reads workspace
storage SQLite databases, extracts AI conversation history, and returns
ParsedPrompt objects.
```

### PR Requirements

1. **Description** -- Explain what the PR does and why. Link related issues.
2. **Testing** -- Describe how you tested the changes. Include screenshots for UI changes.
3. **Lint clean** -- Run `npm run lint` and fix any issues.
4. **Build clean** -- Run `npm run build` to verify no build errors.
5. **Small scope** -- Keep PRs focused. One feature or fix per PR.

### Review Process

- PRs require at least one review before merging.
- Address review feedback with new commits (do not force-push during review).
- Squash merge is the default merge strategy.

## Areas for Contribution

### Good First Issues

- Add unit tests for classification functions.
- Add unit tests for scoring functions.
- Improve keyword lists for category classification.
- Add intent patterns for edge cases.

### Medium Effort

- Implement a new source adapter (see [Parsing Adapters](parsing-adapters.md)).
- Add new dashboard chart types.
- Implement prompt export functionality.
- Add keyboard navigation to the prompt explorer.

### Larger Projects

- Implement real Cursor adapter parsing.
- Implement real Claude Code adapter parsing.
- Build the template editor.
- Add ML-based classification.

## Reporting Issues

When reporting a bug:

1. Describe the expected behavior and the actual behavior.
2. Include steps to reproduce.
3. Include your Node.js version and operating system.
4. Include relevant error messages or screenshots.

When requesting a feature:

1. Describe the use case.
2. Explain why existing features do not address it.
3. If possible, suggest an implementation approach.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
