# Roadmap

## v0.1 -- MVP (current)

The foundation: a working dashboard with demo data, classification, and exploration.

- [x] Database schema with Drizzle ORM and SQLite
- [x] Seed script with realistic demo data
- [x] Dashboard with aggregate statistics and charts
- [x] Prompt explorer with filtering and pagination
- [x] Session timeline view
- [x] Project-level analytics
- [x] Source management page
- [x] Automatic category classification (13 categories, keyword-weighted)
- [x] Automatic intent classification (8 intents, pattern-matched)
- [x] Reuse scoring heuristic (0--100)
- [x] Success scoring heuristic (0--100)
- [x] Full-text fuzzy search via Fuse.js
- [x] Command palette (Cmd+K)
- [x] Template candidates page
- [x] Dark theme UI with Tailwind CSS
- [x] Placeholder adapters for Cursor and Claude Code

## v0.2 -- Real Adapter Parsing

Connect to actual AI tool history files.

- [ ] Cursor adapter: parse workspace storage SQLite databases
- [ ] Claude Code adapter: parse JSONL conversation logs from `~/.claude/projects/`
- [ ] Incremental scanning (only process new data since last scan)
- [ ] Scan scheduling (manual trigger, on-startup, periodic)
- [ ] Source configuration UI (custom paths, enable/disable)
- [ ] Error handling and recovery for malformed source data
- [ ] Adapter test suite with fixture data

## v0.3 -- Template Management

Extract, edit, and organize reusable prompt templates.

- [ ] Template editor with parameterized placeholders
- [ ] Template collections and folders
- [ ] Export templates to Markdown, JSON, or clipboard
- [ ] Import templates from files
- [ ] Template usage tracking (which prompts match which template)
- [ ] Template sharing via file export

## v0.4 -- Smarter Classification and Scoring

Improve the intelligence layer with more sophisticated analysis.

- [ ] ML-based category classification (local model, no API calls)
- [ ] Improved success scoring with response analysis
- [ ] Prompt complexity scoring
- [ ] Drift detection (how prompt patterns change over time)
- [ ] Anomaly detection (unusual prompts, outlier sessions)
- [ ] Custom category and intent definitions
- [ ] Tagging system with auto-suggestions

## v0.5 -- Team Features

Support for shared prompt intelligence across a team.

- [ ] Multi-user support with local profiles
- [ ] Shared template library
- [ ] Team dashboard with aggregated statistics
- [ ] Export/import full database snapshots
- [ ] Prompt review workflow (flag, comment, approve templates)
- [ ] Comparison view: my patterns vs. team patterns

## Future

Ideas under consideration for later releases.

- **VS Code extension** -- Browse PromptTrace data directly in the editor sidebar.
- **CLI tool** -- Query and search prompts from the terminal (`prompttrace search "refactor hook"`).
- **Plugin system** -- Third-party adapter and visualization plugins.
- **Copilot adapter** -- Parse GitHub Copilot Chat history.
- **Gemini CLI adapter** -- Parse Google Gemini CLI conversation logs.
- **Codex CLI adapter** -- Parse OpenAI Codex CLI history.
- **Prompt diff view** -- Side-by-side comparison of similar prompts.
- **Cost tracking dashboard** -- Detailed token usage and cost analytics per model.
- **Prompt linting** -- Warn about common prompt anti-patterns.
- **Webhook / automation** -- Trigger actions when certain prompt patterns are detected.

## Versioning

PromptTrace follows semantic versioning. The current version is 0.1.0. Breaking changes to the database schema or adapter interface will be accompanied by migration scripts.
