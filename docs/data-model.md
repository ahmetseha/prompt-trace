# Data Model

All data is stored in a local SQLite database at `data/prompttrace.db`. The schema is defined using Drizzle ORM in `src/lib/db/schema.ts`.

Timestamps are stored as Unix epoch integers (milliseconds). Boolean values use SQLite integer convention (0 = false, 1 = true). JSON data is stored as serialized text.

## Entity Relationship Diagram

```
sources ---< sessions ---< prompts >--- projects
                              |
                              +---< prompt_files
                              +---< prompt_tags

template_candidates (standalone)
```

## Tables

### sources

Represents a configured AI coding tool data source.

| Column           | Type    | Nullable | Default  | Description                                      |
| ---------------- | ------- | -------- | -------- | ------------------------------------------------ |
| `id`             | text    | no       | --       | Primary key (UUID)                               |
| `name`           | text    | no       | --       | Human-readable source name (e.g., "Cursor")      |
| `type`           | text    | no       | --       | Source type enum: `cursor`, `claude-code`, `copilot`, `gemini-cli`, `codex-cli`, `json-import`, `markdown-import` |
| `enabled`        | integer | no       | `1`      | Whether this source is active (0 or 1)           |
| `status`         | text    | no       | `'idle'` | Current scan status: `idle`, `scanning`, `error`  |
| `last_scanned_at`| integer | yes      | --       | Timestamp of the last successful scan            |
| `metadata_json`  | text    | yes      | --       | Arbitrary JSON metadata for the source           |
| `created_at`     | integer | no       | --       | Record creation timestamp                        |
| `updated_at`     | integer | no       | --       | Record last-updated timestamp                    |

**Relations:** One source has many sessions. One source has many prompts.

### projects

Represents a code project detected from prompt context (file paths, workspace names).

| Column         | Type    | Nullable | Default | Description                              |
| -------------- | ------- | -------- | ------- | ---------------------------------------- |
| `id`           | text    | no       | --      | Primary key (UUID)                       |
| `name`         | text    | no       | --      | Project name                             |
| `path`         | text    | no       | --      | Filesystem path to the project root      |
| `first_seen_at`| integer | yes      | --      | Timestamp of the earliest prompt in this project |
| `last_seen_at` | integer | yes      | --      | Timestamp of the most recent prompt      |
| `created_at`   | integer | no       | --      | Record creation timestamp                |
| `updated_at`   | integer | no       | --      | Record last-updated timestamp            |

**Relations:** One project has many sessions. One project has many prompts.

### sessions

Represents a contiguous block of interaction with an AI tool.

| Column                | Type    | Nullable | Default | Description                                       |
| --------------------- | ------- | -------- | ------- | ------------------------------------------------- |
| `id`                  | text    | no       | --      | Primary key (UUID)                                |
| `source_id`           | text    | yes      | --      | Foreign key to `sources.id`                       |
| `project_id`          | text    | yes      | --      | Foreign key to `projects.id`                      |
| `external_session_id` | text    | yes      | --      | Session ID from the original tool                 |
| `title`               | text    | yes      | --      | Session title or summary                          |
| `started_at`          | integer | yes      | --      | Timestamp when the session began                  |
| `ended_at`            | integer | yes      | --      | Timestamp when the session ended                  |
| `prompt_count`        | integer | no       | `0`     | Number of prompts in this session                 |
| `model_summary_json`  | text    | yes      | --      | JSON object summarizing model usage in the session |
| `metadata_json`       | text    | yes      | --      | Arbitrary JSON metadata                           |
| `created_at`          | integer | no       | --      | Record creation timestamp                         |
| `updated_at`          | integer | no       | --      | Record last-updated timestamp                     |

**Relations:** Belongs to one source. Belongs to one project. Has many prompts.

### prompts

The central table. Each row represents a single prompt sent to an AI coding assistant.

| Column             | Type    | Nullable | Default | Description                                              |
| ------------------ | ------- | -------- | ------- | -------------------------------------------------------- |
| `id`               | text    | no       | --      | Primary key (UUID)                                       |
| `source_id`        | text    | yes      | --      | Foreign key to `sources.id`                              |
| `project_id`       | text    | yes      | --      | Foreign key to `projects.id`                             |
| `session_id`       | text    | yes      | --      | Foreign key to `sessions.id`                             |
| `timestamp`        | integer | yes      | --      | When the prompt was sent                                 |
| `prompt_text`      | text    | yes      | --      | The full prompt text                                     |
| `response_preview` | text    | yes      | --      | Truncated preview of the AI response                     |
| `model`            | text    | yes      | --      | Model used (e.g., `gpt-4o`, `claude-sonnet-4-20250514`, `cursor-small`) |
| `prompt_length`    | integer | yes      | --      | Character count of the prompt text                       |
| `category`         | text    | yes      | --      | Classified category (see PromptCategory type)            |
| `intent`           | text    | yes      | --      | Classified intent (see PromptIntent type)                |
| `token_estimate`   | integer | yes      | --      | Estimated token count                                    |
| `cost_estimate`    | real    | yes      | --      | Estimated cost in USD                                    |
| `success_score`    | real    | yes      | --      | Heuristic success score (0--100)                         |
| `reuse_score`      | real    | yes      | --      | Heuristic reuse/template-worthiness score (0--100)       |
| `metadata_json`    | text    | yes      | --      | Arbitrary JSON metadata                                  |
| `created_at`       | integer | no       | --      | Record creation timestamp                                |
| `updated_at`       | integer | no       | --      | Record last-updated timestamp                            |

**Relations:** Belongs to one source. Belongs to one project. Belongs to one session. Has many prompt_files. Has many prompt_tags.

### prompt_files

Tracks files referenced or modified in connection with a prompt.

| Column        | Type    | Nullable | Default | Description                                  |
| ------------- | ------- | -------- | ------- | -------------------------------------------- |
| `id`          | text    | no       | --      | Primary key (UUID)                           |
| `prompt_id`   | text    | no       | --      | Foreign key to `prompts.id`                  |
| `file_path`   | text    | no       | --      | Path to the file                             |
| `action_type` | text    | yes      | --      | What happened to the file: `created`, `modified`, `deleted`, `read` |
| `created_at`  | integer | no       | --      | Record creation timestamp                    |

**Relations:** Belongs to one prompt.

### prompt_tags

Stores tags applied to prompts (e.g., user-defined labels, auto-generated keywords).

| Column      | Type | Nullable | Default | Description                     |
| ----------- | ---- | -------- | ------- | ------------------------------- |
| `id`        | text | no       | --      | Primary key (UUID)              |
| `prompt_id` | text | no       | --      | Foreign key to `prompts.id`     |
| `tag`       | text | no       | --      | The tag value                   |

**Relations:** Belongs to one prompt.

### template_candidates

Stores prompts identified as having high reuse potential, suitable for extraction into templates.

| Column                  | Type | Nullable | Default | Description                                          |
| ----------------------- | ---- | -------- | ------- | ---------------------------------------------------- |
| `id`                    | text | no       | --      | Primary key (UUID)                                   |
| `title`                 | text | no       | --      | Template title                                       |
| `normalized_pattern`    | text | yes      | --      | The prompt text with project-specific details removed |
| `description`           | text | yes      | --      | Human-readable description of what this template does |
| `source_prompt_ids_json`| text | yes      | --      | JSON array of prompt IDs that contributed to this template |
| `reuse_score`           | real | yes      | --      | Aggregate reuse score                                |
| `category`              | text | yes      | --      | Primary category of this template                    |
| `created_at`            | integer | no    | --      | Record creation timestamp                            |
| `updated_at`            | integer | no    | --      | Record last-updated timestamp                        |

**Relations:** Standalone (references prompt IDs via JSON, not foreign keys).

## Enumerated Types

### PromptCategory

```
bug-fixing | refactor | architecture | code-generation | debugging | styling |
testing | documentation | deployment | data-backend | performance |
exploratory | review | unknown
```

### PromptIntent

```
ask | instruct | compare | generate | fix | explain | plan | transform
```

### SourceType

```
cursor | claude-code | copilot | gemini-cli | codex-cli | json-import | markdown-import
```

## Notes

- All primary keys are UUIDs stored as text.
- Foreign keys use SQLite `REFERENCES` constraints.
- Drizzle ORM relations are defined alongside table schemas for type-safe joins.
- JSON columns (`metadata_json`, `model_summary_json`, `source_prompt_ids_json`) store serialized objects. These are parsed at the application layer.
- The schema uses `integer` for timestamps rather than SQLite `datetime` for simpler arithmetic and sorting.
