import { getAllSources, getAllPrompts } from "@/lib/data";
import { SourceCard } from "@/features/sources/source-card";
import { SourceIcon } from "@/components/source-icon";
import { Plug, Plus, FileJson, FileText } from "lucide-react";
import type { SourceType } from "@/lib/types";

export default async function SourcesPage() {
  const [sources, prompts] = await Promise.all([
    getAllSources(),
    getAllPrompts(),
  ]);

  // Count prompts per source
  const promptCountBySource = prompts.reduce<Record<string, number>>(
    (acc, p) => {
      if (p.sourceId) {
        acc[p.sourceId] = (acc[p.sourceId] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  const importOptions: { type: SourceType; label: string; description: string; icon: React.ElementType }[] = [
    {
      type: "json-import",
      label: "JSON Import",
      description: "Import prompts from a JSON file matching the PromptTrace schema.",
      icon: FileJson,
    },
    {
      type: "markdown-import",
      label: "Markdown Import",
      description: "Import prompts from Markdown conversation exports.",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Sources</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sources.length} connected source{sources.length !== 1 && "s"} across your AI tools.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5">
          <Plug className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">
            {sources.length} Total
          </span>
        </div>
      </div>

      {/* Source cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            promptCount={promptCountBySource[source.id] ?? 0}
          />
        ))}

        {/* Add Source card */}
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800">
            <Plus className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Add Source</p>
            <p className="mt-0.5 text-xs">Connect a new AI tool</p>
          </div>
        </button>
      </div>

      {/* Manual Import Section */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">Manual Import</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Import prompts from files directly.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {importOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.type}
                className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                  <SourceIcon type={opt.type} size="md" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-zinc-100">
                    {opt.label}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {opt.description}
                  </p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-white"
                  >
                    Import File
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
