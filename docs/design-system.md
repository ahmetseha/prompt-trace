# Design System

PromptTrace uses a dark-first design system built on Tailwind CSS 4 with custom theme tokens. The UI draws from shadcn/ui component patterns with Radix UI primitives for accessibility.

## Color Palette

All colors are defined as CSS custom properties in `src/app/globals.css` under the `@theme` directive.

### Core Colors

| Token                    | Value     | Usage                              |
| ------------------------ | --------- | ---------------------------------- |
| `--color-background`     | `#09090b` | Page background (zinc-950)         |
| `--color-foreground`     | `#fafafa` | Primary text (zinc-50)             |
| `--color-muted`          | `#27272a` | Muted backgrounds (zinc-800)       |
| `--color-muted-foreground`| `#a1a1aa`| Secondary text (zinc-400)          |
| `--color-card`           | `#18181b` | Card backgrounds (zinc-900)        |
| `--color-card-foreground`| `#fafafa` | Card text                          |
| `--color-border`         | `#27272a` | Borders and dividers               |
| `--color-input`          | `#27272a` | Input field borders                |
| `--color-ring`           | `#3f3f46` | Focus ring color (zinc-700)        |

### Interactive Colors

| Token                          | Value     | Usage                       |
| ------------------------------ | --------- | --------------------------- |
| `--color-primary`              | `#e4e4e7` | Primary buttons, links      |
| `--color-primary-foreground`   | `#09090b` | Text on primary             |
| `--color-secondary`            | `#27272a` | Secondary buttons           |
| `--color-secondary-foreground` | `#fafafa` | Text on secondary           |
| `--color-accent`               | `#27272a` | Accent/hover backgrounds    |
| `--color-accent-foreground`    | `#fafafa` | Text on accent              |
| `--color-destructive`          | `#dc2626` | Destructive actions (red-600)|
| `--color-destructive-foreground`| `#fafafa`| Text on destructive         |

### Chart Colors

Used by Recharts for data visualization.

| Token             | Value     | Description     |
| ----------------- | --------- | --------------- |
| `--color-chart-1` | `#6366f1` | Indigo-500      |
| `--color-chart-2` | `#8b5cf6` | Violet-500      |
| `--color-chart-3` | `#a78bfa` | Violet-400      |
| `--color-chart-4` | `#06b6d4` | Cyan-500        |
| `--color-chart-5` | `#10b981` | Emerald-500     |
| `--color-chart-6` | `#f59e0b` | Amber-500       |

### Category Colors

Each prompt category has a dedicated color for badges and charts.

| Token                       | Value     | Category        |
| --------------------------- | --------- | --------------- |
| `--color-category-bug`      | `#ef4444` | Bug-fixing      |
| `--color-category-refactor` | `#8b5cf6` | Refactor        |
| `--color-category-codegen`  | `#6366f1` | Code generation |
| `--color-category-debug`    | `#f97316` | Debugging       |
| `--color-category-test`     | `#10b981` | Testing         |
| `--color-category-style`    | `#ec4899` | Styling         |
| `--color-category-docs`     | `#06b6d4` | Documentation   |
| `--color-category-deploy`   | `#eab308` | Deployment      |
| `--color-category-data`     | `#14b8a6` | Data/backend    |
| `--color-category-perf`     | `#f59e0b` | Performance     |
| `--color-category-arch`     | `#3b82f6` | Architecture    |
| `--color-category-explore`  | `#a78bfa` | Exploratory     |
| `--color-category-review`   | `#64748b` | Review          |

## Typography

| Property   | Value                                        |
| ---------- | -------------------------------------------- |
| Sans-serif | Inter, ui-sans-serif, system-ui, sans-serif  |
| Monospace  | JetBrains Mono, ui-monospace, monospace      |

- Body text uses the sans-serif stack.
- Code snippets, file paths, and technical values use the monospace stack.
- Base font size follows Tailwind defaults (16px).

## Spacing and Layout

| Property       | Value      |
| -------------- | ---------- |
| Border radius  | `0.75rem` (12px) via `--radius` |
| Card padding   | `p-4` to `p-6` (16--24px)       |
| Section gaps   | `gap-4` to `gap-6` (16--24px)   |
| Page margins   | `p-6` (24px)                     |
| Sidebar width  | Fixed, collapsible               |

## Component Library

The project uses shadcn/ui-style components in `src/components/ui/`. These are local copies (not installed from a package) and can be customized freely.

### Base Primitives

| Component       | File               | Description                           |
| --------------- | ------------------ | ------------------------------------- |
| Button          | `ui/button.tsx`    | Primary, secondary, ghost, destructive variants |
| Card            | `ui/card.tsx`      | Container with header, content, footer |
| Badge           | `ui/badge.tsx`     | Small label, multiple color variants   |
| Input           | `ui/input.tsx`     | Text input field                       |
| Select          | `ui/select.tsx`    | Dropdown select (Radix)               |
| Dialog          | `ui/dialog.tsx`    | Modal dialog (Radix)                  |
| Sheet           | `ui/sheet.tsx`     | Slide-out panel (Radix)               |
| Tabs            | `ui/tabs.tsx`      | Tab navigation (Radix)                |
| Tooltip         | `ui/tooltip.tsx`   | Hover tooltip (Radix)                 |
| Dropdown Menu   | `ui/dropdown-menu.tsx` | Context/dropdown menu (Radix)     |
| Accordion       | `ui/accordion.tsx` | Collapsible sections (Radix)          |
| Scroll Area     | `ui/scroll-area.tsx` | Custom scrollable container (Radix)|
| Separator       | `ui/separator.tsx` | Horizontal/vertical divider           |
| Skeleton        | `ui/skeleton.tsx`  | Loading placeholder                   |
| Progress        | `ui/progress.tsx`  | Progress bar                          |

### Application Components

| Component        | File                    | Description                              |
| ---------------- | ----------------------- | ---------------------------------------- |
| AppSidebar       | `app-sidebar.tsx`       | Main navigation sidebar                  |
| TopBar           | `top-bar.tsx`           | Top navigation bar with breadcrumbs      |
| CommandPalette   | `command-palette.tsx`   | Cmd+K search and navigation              |
| StatsCard        | `stats-card.tsx`        | Metric display with label and value      |
| ChartCard        | `chart-card.tsx`        | Container for Recharts visualizations    |
| CategoryBadge    | `category-badge.tsx`    | Colored badge using category color tokens|
| SourceIcon       | `source-icon.tsx`       | Icon for source type (Cursor, Claude, etc.)|
| EmptyState       | `empty-state.tsx`       | Placeholder for empty lists/views        |

## Dark Theme Approach

PromptTrace is dark-only. The color system is built around the Zinc palette from Tailwind CSS:

- **Background:** zinc-950 (`#09090b`)
- **Surface/cards:** zinc-900 (`#18181b`)
- **Borders/muted:** zinc-800 (`#27272a`)
- **Secondary text:** zinc-400 (`#a1a1aa`)
- **Primary text:** zinc-50 (`#fafafa`)

This creates a layered depth effect: background < card surface < interactive elements.

Accent colors (chart colors, category colors) are high-saturation to stand out against the neutral dark background. The destructive color (red-600) is used sparingly for delete actions and error states.

### Custom Scrollbars

WebKit scrollbars are styled to match the dark theme:

- Track: transparent
- Thumb: zinc-700 (`#3f3f46`), zinc-600 on hover (`#52525b`)
- Width: 6px

### Recharts Overrides

Recharts grid lines and text are overridden via CSS to match the dark theme:

- Grid lines: zinc-800 (`#27272a`)
- Axis text: zinc-400 (`#a1a1aa`), 12px
- Tooltip: zinc-900 background with zinc-800 border

## Class Merging

The `cn()` utility in `src/lib/utils/index.ts` combines `clsx` and `tailwind-merge` for conditional, conflict-free class composition:

```typescript
import { cn } from "@/lib/utils";

<div className={cn("p-4 rounded-lg", isActive && "bg-accent")} />
```

Use `cn()` whenever combining conditional Tailwind classes to avoid duplicate or conflicting utilities.
