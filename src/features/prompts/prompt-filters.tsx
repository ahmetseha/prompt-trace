import { Search, X } from "lucide-react";

export interface PromptFilterValues {
  search: string;
  source: string;
  category: string;
  model: string;
  project: string;
  sort: string;
}

interface PromptFiltersProps {
  filters: PromptFilterValues;
  onChange: (filters: PromptFilterValues) => void;
  sources: { id: string; name: string }[];
  categories: string[];
  models: string[];
  projects: { id: string; name: string }[];
}

const selectClass =
  "rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-600 transition-colors";

const categoryLabels: Record<string, string> = {
  "bug-fixing": "Bug Fix",
  refactor: "Refactor",
  architecture: "Architecture",
  "code-generation": "Code Gen",
  debugging: "Debugging",
  styling: "Styling",
  testing: "Testing",
  documentation: "Docs",
  deployment: "Deploy",
  "data-backend": "Data/API",
  performance: "Perf",
  exploratory: "Explore",
  review: "Review",
  unknown: "Other",
};

export function PromptFilters({
  filters,
  onChange,
  sources,
  categories,
  models,
  projects,
}: PromptFiltersProps) {
  function update(partial: Partial<PromptFilterValues>) {
    onChange({ ...filters, ...partial });
  }

  const hasFilters =
    filters.search ||
    filters.source ||
    filters.category ||
    filters.model ||
    filters.project ||
    filters.sort !== "newest";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-600 transition-colors w-56"
        />
      </div>

      {/* Source */}
      <select
        value={filters.source}
        onChange={(e) => update({ source: e.target.value })}
        className={selectClass}
      >
        <option value="">All Sources</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        value={filters.category}
        onChange={(e) => update({ category: e.target.value })}
        className={selectClass}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {categoryLabels[c] ?? c}
          </option>
        ))}
      </select>

      {/* Model */}
      <select
        value={filters.model}
        onChange={(e) => update({ model: e.target.value })}
        className={selectClass}
      >
        <option value="">All Models</option>
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Project */}
      <select
        value={filters.project}
        onChange={(e) => update({ project: e.target.value })}
        className={selectClass}
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value })}
        className={selectClass}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="reuse">Highest Reuse Score</option>
        <option value="longest">Longest</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() =>
            onChange({
              search: "",
              source: "",
              category: "",
              model: "",
              project: "",
              sort: "newest",
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
