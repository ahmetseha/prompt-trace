import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import type { TemplateCandidate } from "@/lib/types";

interface TemplateCardProps {
  template: TemplateCandidate;
  className?: string;
}

export function TemplateCard({ template, className }: TemplateCardProps) {
  const [patternExpanded, setPatternExpanded] = useState(false);
  const sourcePromptIds: string[] = template.sourcePromptIdsJson
    ? (() => {
        try {
          return JSON.parse(template.sourcePromptIdsJson);
        } catch {
          return [];
        }
      })()
    : [];

  const reusePercent = template.reuseScore != null ? Math.round(template.reuseScore * 100) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900 p-5",
        className
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-sm font-medium text-zinc-100">{template.title}</h3>
        {template.category && <CategoryBadge category={template.category} />}
      </div>

      {/* Normalized pattern */}
      {template.normalizedPattern && (
        <div className={cn("mt-3 rounded-lg bg-zinc-950 px-3 py-2.5 overflow-x-auto relative", !patternExpanded && "max-h-24 overflow-hidden")}>
          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap break-words leading-relaxed">
            {template.normalizedPattern}
          </pre>
          {!patternExpanded && (
            <button
              onClick={() => setPatternExpanded(true)}
              className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-zinc-950 to-transparent pt-6 pb-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Expand
            </button>
          )}
        </div>
      )}

      {/* Description */}
      {template.description && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Reuse score bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-zinc-500">Reuse Score</span>
          <span className="text-[11px] font-medium text-zinc-300">{reusePercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              reusePercent >= 70
                ? "bg-emerald-500"
                : reusePercent >= 40
                  ? "bg-amber-500"
                  : "bg-zinc-500"
            )}
            style={{ width: `${Math.min(reusePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-3 border-t border-zinc-800 pt-3">
        <span className="text-[11px] text-zinc-500">
          {sourcePromptIds.length} source prompt{sourcePromptIds.length !== 1 ? "s" : ""}
        </span>
        {template.category && (
          <CategoryBadge category={template.category} className="ml-auto" />
        )}
      </div>
    </div>
  );
}
