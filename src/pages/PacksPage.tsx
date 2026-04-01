import { PageLoader } from "@/components/page-loader";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryBadge } from "@/components/category-badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Layers, Copy, Check, ChevronDown } from "lucide-react";
import type { PromptCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types (matching DB shape)
// ---------------------------------------------------------------------------

interface PackStep {
  order: number;
  normalizedPrompt: string;
  category: string;
  intent: string;
  examplePromptId?: string;
}

interface PromptPack {
  id: string;
  title: string;
  description: string | null;
  workflowType: string | null;
  score: number | null;
  stepsJson: string | null;
  createdAt: number;
  updatedAt: number;
}

function parseSteps(pack: PromptPack): PackStep[] {
  if (!pack.stepsJson) return [];
  try {
    return JSON.parse(pack.stepsJson);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Export helper
// ---------------------------------------------------------------------------

function exportPackMarkdown(pack: PromptPack, steps: PackStep[]): string {
  const lines = [
    `# ${pack.title}`,
    "",
    pack.description ?? "",
    "",
    `**Workflow:** ${pack.workflowType ?? "general"}`,
    `**Confidence:** ${pack.score ?? 0}%`,
    "",
    "## Steps",
    "",
  ];
  for (const step of steps) {
    lines.push(`### Step ${step.order} - ${step.category}`);
    lines.push(`**Intent:** ${step.intent}`);
    lines.push("```");
    lines.push(step.normalizedPrompt);
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Pack Card
// ---------------------------------------------------------------------------

function PackCard({ pack }: { pack: PromptPack }) {
  const [copied, setCopied] = useState(false);
  const steps = parseSteps(pack);
  const scoreValue = pack.score ?? 0;

  const handleExport = () => {
    navigator.clipboard.writeText(exportPackMarkdown(pack, steps));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-zinc-100">{pack.title}</h3>
          {pack.workflowType && (
            <span className="mt-1 inline-flex items-center rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
              {pack.workflowType}
            </span>
          )}
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors shrink-0"
          title="Copy as Markdown"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied" : "Export"}
        </button>
      </div>

      {/* Description */}
      {pack.description && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {pack.description}
        </p>
      )}

      {/* Score bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-zinc-500">Confidence</span>
          <span className="text-[11px] font-medium text-zinc-300">
            {Math.round(scoreValue)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              scoreValue >= 70
                ? "bg-emerald-500"
                : scoreValue >= 40
                  ? "bg-amber-500"
                  : "bg-zinc-500"
            )}
            style={{ width: `${Math.min(scoreValue, 100)}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Steps
          </span>
          <ol className="space-y-2">
            {steps.map((step) => (
              <li
                key={step.order}
                className="rounded-lg border border-zinc-800/50 bg-zinc-800/30 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                    {step.order}
                  </span>
                  {step.category && (
                    <CategoryBadge
                      category={step.category as PromptCategory}
                    />
                  )}
                  <span className="text-[11px] text-zinc-500">
                    {step.intent}
                  </span>
                </div>
                <div className="rounded-md bg-zinc-950 px-2.5 py-2 overflow-x-auto">
                  <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap break-words leading-relaxed">
                    {step.normalizedPrompt}
                  </pre>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SortOption = "score" | "steps" | "newest";

export function PacksPage() {
  const [sortBy, setSortBy] = useState<SortOption>("score");

  const { data: allPacks, isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: api.getPacks,
  });

  if (isLoading) return <PageLoader />;

  const packs = [...(allPacks || [])].sort((a: any, b: any) => {
    switch (sortBy) {
      case "score":
        return (b.score ?? 0) - (a.score ?? 0);
      case "steps": {
        const aSteps = parseSteps(a).length;
        const bSteps = parseSteps(b).length;
        return bSteps - aSteps;
      }
      case "newest":
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Packs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {packs.length} prompt pack{packs.length !== 1 ? "s" : ""} detected
            from your workflow patterns
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 pr-8 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="score">Highest Score</option>
            <option value="steps">Most Steps</option>
            <option value="newest">Newest</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Explanation banner */}
      <div className="rounded-xl border border-zinc-800 bg-indigo-950/20 p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-sm text-zinc-400 leading-relaxed">
            <span className="text-zinc-200 font-medium">
              What are Prompt Packs?
            </span>{" "}
            Reusable prompt sequences detected from your workflow patterns.
            PromptTrace analyzes your sessions and finds category sequences that
            repeat across multiple sessions, then packages them into reusable
            packs you can follow for consistent results.
          </div>
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <Layers className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No packs detected yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Packs are inferred after scanning your prompt history across multiple
            sessions. Use the Sync button to scan your sources.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack: any) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}
