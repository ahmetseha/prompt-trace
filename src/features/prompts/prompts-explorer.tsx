import { useState, useMemo } from "react";
import { SearchX } from "lucide-react";
import type { Prompt, Source, Project, PromptFile } from "@/lib/types";
import { PromptFilters, type PromptFilterValues } from "./prompt-filters";
import { PromptListItem } from "./prompt-list-item";

interface PromptsExplorerProps {
  prompts: Prompt[];
  sources: Source[];
  projects: Project[];
  promptFiles: PromptFile[];
}

export function PromptsExplorer({
  prompts,
  sources,
  projects,
  promptFiles,
}: PromptsExplorerProps) {
  const [filters, setFilters] = useState<PromptFilterValues>({
    search: "",
    source: "",
    category: "",
    model: "",
    project: "",
    sort: "newest",
    quality: "",
    intent: "",
  });

  // Derive filter options from data
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    prompts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [prompts]);

  const uniqueModels = useMemo(() => {
    const models = new Set<string>();
    prompts.forEach((p) => {
      if (p.model) models.add(p.model);
    });
    return Array.from(models).sort();
  }, [prompts]);

  // File count lookup
  const fileCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    promptFiles.forEach((pf) => {
      map[pf.promptId] = (map[pf.promptId] || 0) + 1;
    });
    return map;
  }, [promptFiles]);

  // Source lookup
  const sourceMap = useMemo(() => {
    const map: Record<string, Source> = {};
    sources.forEach((s) => (map[s.id] = s));
    return map;
  }, [sources]);

  // Project lookup
  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => (map[p.id] = p));
    return map;
  }, [projects]);

  // Filter and sort
  // Summary counts
  const weakCount = useMemo(
    () => prompts.filter((p) => (p.successScore ?? 100) < 40).length,
    [prompts]
  );
  const reusableCount = useMemo(
    () => prompts.filter((p) => (p.reuseScore ?? 0) > 60).length,
    [prompts]
  );

  const filtered = useMemo(() => {
    let result = prompts;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.promptText?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q) ||
          p.responsePreview?.toLowerCase().includes(q)
      );
    }

    if (filters.source) {
      result = result.filter((p) => p.sourceId === filters.source);
    }

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.model) {
      result = result.filter((p) => p.model === filters.model);
    }

    if (filters.project) {
      result = result.filter((p) => p.projectId === filters.project);
    }

    if (filters.quality) {
      switch (filters.quality) {
        case "high":
          result = result.filter((p) => (p.successScore ?? 0) > 60);
          break;
        case "weak":
          result = result.filter((p) => (p.successScore ?? 100) < 40);
          break;
        case "reusable":
          result = result.filter((p) => (p.reuseScore ?? 0) > 60);
          break;
      }
    }

    if (filters.intent) {
      result = result.filter((p) => p.intent === filters.intent);
    }

    // Sort
    const sorted = [...result];
    switch (filters.sort) {
      case "oldest":
        sorted.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
        break;
      case "reuse":
        sorted.sort((a, b) => (b.reuseScore ?? 0) - (a.reuseScore ?? 0));
        break;
      case "longest":
        sorted.sort((a, b) => (b.promptLength ?? 0) - (a.promptLength ?? 0));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
        break;
    }

    return sorted;
  }, [prompts, filters]);

  return (
    <div className="space-y-6">
      <PromptFilters
        filters={filters}
        onChange={setFilters}
        sources={sources.map((s) => ({ id: s.id, name: s.name }))}
        categories={uniqueCategories}
        models={uniqueModels}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />

      <div className="flex items-center gap-4 text-sm tabular-nums">
        <span className="text-zinc-500">
          <span className="font-medium">{filtered.length}</span> {filtered.length === 1 ? "prompt" : "prompts"}
        </span>
        {weakCount > 0 && (
          <span className="text-red-400"><span className="font-medium">{weakCount}</span> weak</span>
        )}
        {reusableCount > 0 && (
          <span className="text-emerald-400"><span className="font-medium">{reusableCount}</span> reusable</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/50 py-16 text-center">
          <SearchX className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-400">No prompts match your filters</p>
          <p className="mt-1 text-xs text-zinc-600">
            Try adjusting your search or clearing filters
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prompt) => {
            const source = prompt.sourceId
              ? sourceMap[prompt.sourceId]
              : undefined;
            const project = prompt.projectId
              ? projectMap[prompt.projectId]
              : undefined;

            return (
              <PromptListItem
                key={prompt.id}
                prompt={prompt}
                projectName={project?.name ?? "Unknown"}
                sourceType={source?.type ?? "json-import"}
                fileCount={fileCountMap[prompt.id] ?? 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
