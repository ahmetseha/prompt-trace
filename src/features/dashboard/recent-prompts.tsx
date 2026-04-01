import { Link } from "react-router-dom";
import { formatRelativeDate, truncate } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { SourceIcon } from "@/components/source-icon";
import type { Prompt, PromptCategory, SourceType } from "@/lib/types";

interface RecentPromptsProps {
  prompts: Prompt[];
}

export function RecentPrompts({ prompts }: RecentPromptsProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Recent Prompts</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Latest AI interactions
          </p>
        </div>
        <Link
          to="/dashboard/prompts"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {prompts.slice(0, 6).map((prompt) => (
          <Link
            key={prompt.id}
            to={`/dashboard/prompts/${prompt.id}`}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-800/50"
          >
            <SourceIcon
              type={(prompt.sourceId?.replace("src-", "") || "json-import") as SourceType}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-zinc-200">
                {truncate(prompt.promptText ?? "", 80)}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <CategoryBadge
                  category={(prompt.category || "unknown") as PromptCategory}
                />
                <span className="text-[11px] text-zinc-500">
                  {prompt.timestamp ? formatRelativeDate(prompt.timestamp) : ""}
                </span>
              </div>
            </div>
            {prompt.reuseScore !== null && prompt.reuseScore > 70 && (
              <span className="mt-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                Reusable
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
