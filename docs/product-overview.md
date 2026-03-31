# Product Overview

## The Problem

Developers increasingly rely on AI coding assistants -- Cursor, Claude Code, GitHub Copilot, and others -- throughout their daily work. Over weeks and months, thousands of prompts accumulate across multiple tools with no way to search, analyze, or learn from them. Valuable prompt patterns get lost. There is no visibility into which prompts produce good results, which categories dominate a workflow, or which patterns are worth reusing.

AI coding tools store conversation history in proprietary, tool-specific formats scattered across local directories. There is no unified view, no cross-tool search, and no way to extract institutional knowledge from prompt history.

## What PromptTrace Does

PromptTrace is a local-first developer tool that scans AI coding assistant histories and turns them into a structured prompt intelligence dashboard. It reads prompt data from multiple sources, normalizes it into a common schema, classifies each prompt by category and intent, scores prompts for reusability and effectiveness, and presents everything in an interactive dashboard.

All data stays on your machine. PromptTrace is a localhost web application backed by a local SQLite database.

## Who It Is For

- **Individual developers** who want to understand and improve their AI prompting habits.
- **Tech leads** who want visibility into how their team uses AI tools across projects.
- **Prompt engineers** who want to identify, refine, and catalog reusable prompt templates.
- **Anyone curious** about their own AI-assisted development patterns.

## Core Features

### Multi-Source Ingestion

PromptTrace uses a pluggable adapter system to read prompt history from different AI tools. Each adapter knows how to locate, parse, and normalize data from a specific source. Adding a new source means implementing a single `SourceAdapter` interface.

### Automatic Classification

Every prompt is classified along two dimensions:

- **Category** -- the domain of work (bug-fixing, refactoring, code-generation, testing, styling, documentation, deployment, data/backend, performance, architecture, exploratory, review).
- **Intent** -- the type of request (ask, instruct, compare, generate, fix, explain, plan, transform).

Classification uses weighted keyword matching with pattern-based bonus scoring. No external API calls are needed.

### Prompt Scoring

Two heuristic scores are computed for each prompt:

- **Reuse score** (0--100) estimates how template-worthy a prompt is based on structure, action orientation, and specificity level.
- **Success score** (0--100) estimates prompt effectiveness using signals like response length, file changes, and prompt clarity.

### Full-Text Search

All prompts are searchable via fuzzy full-text search powered by Fuse.js, with weighted fields for prompt text, category, model, and tags.

### Dashboard Analytics

The dashboard provides visual analytics including:

- Prompt activity over time
- Category and intent distribution
- Model usage breakdown
- Source breakdown
- Top projects by prompt volume
- Recent prompts feed

### Session and Project Tracking

Prompts are organized into sessions (a contiguous block of interaction with an AI tool) and associated with projects (detected from file paths or workspace context). This enables per-project and per-session analysis.

### Template Candidates

PromptTrace identifies prompts with high reuse scores and surfaces them as template candidates -- patterns worth extracting, parameterizing, and reusing across projects.

## Design Principles

1. **Local-first** -- All data stays on your machine. No cloud, no telemetry, no accounts.
2. **Read-only scanning** -- PromptTrace reads AI tool history files but never modifies them.
3. **Source-agnostic** -- The adapter pattern means any AI tool can be supported without changing the core system.
4. **Heuristic-driven** -- Classification and scoring use fast, deterministic heuristics rather than requiring external AI APIs.
5. **Developer-oriented** -- Built with the same stack developers already know (Next.js, TypeScript, Tailwind). Easy to extend.
6. **Privacy-preserving** -- No network requests. No data exfiltration risk. Suitable for use with proprietary codebases.
