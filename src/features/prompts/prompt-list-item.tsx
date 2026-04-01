import { Link } from "react-router-dom";
import { FileText, Clock } from "lucide-react";
import type { Prompt, PromptCategory, SourceType } from "@/lib/types";
import { CategoryBadge } from "@/components/category-badge";
import { SourceIcon } from "@/components/source-icon";
import { truncate, formatRelativeDate } from "@/lib/utils";

interface PromptListItemProps {
  prompt: Prompt;
  projectName: string;
  sourceType: SourceType;
  fileCount: number;
}

export function PromptListItem({
  prompt,
  projectName,
  sourceType,
  fileCount,
}: PromptListItemProps) {
  const text = prompt.promptText ?? "";
  const preview = truncate(text, 100);

  return (
    <Link
      to={`/dashboard/prompts/${prompt.id}`}
      className="group block rounded-xl border border-zinc-800/50 px-5 py-4 transition-colors hover:bg-zinc-800/50"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-relaxed text-zinc-200 group-hover:text-white">
            {preview}
          </p>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <SourceIcon type={sourceType} showLabel size="sm" />

            {prompt.category && (
              <CategoryBadge category={prompt.category} />
            )}

            {prompt.model && (
              <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                {prompt.model}
              </span>
            )}

            <span className="text-zinc-600">&middot;</span>

            <span className="text-zinc-500">{projectName}</span>

            {prompt.timestamp && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(prompt.timestamp)}
                </span>
              </>
            )}

            {fileCount > 0 && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <FileText className="h-3 w-3" />
                  {fileCount} {fileCount === 1 ? "file" : "files"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: scores */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Reuse score - how template-worthy this prompt is */}
          {prompt.reuseScore != null && (
            <div className="flex items-center gap-2" title="Reuse Score: How reusable this prompt is as a template. Higher = more generic and reusable.">
              <span className="text-[11px] text-zinc-500">Reuse</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.min(Math.round(prompt.reuseScore), 100)}%` }}
                />
              </div>
              <span className="w-7 text-right text-[11px] tabular-nums text-zinc-400">
                {Math.round(prompt.reuseScore)}%
              </span>
            </div>
          )}

          {/* Success score - estimated effectiveness */}
          {prompt.successScore != null && (
            <div className="flex items-center gap-2" title="Success Score: Estimated prompt effectiveness based on response quality, file changes, and clarity.">
              <span className="text-[11px] text-zinc-500">Success</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(Math.round(prompt.successScore), 100)}%` }}
                />
              </div>
              <span className="w-7 text-right text-[11px] tabular-nums text-zinc-400">
                {Math.round(prompt.successScore)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
