import type { Prompt, PromptCategory } from "@/lib/types";
import { CategoryBadge } from "@/components/category-badge";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";

interface SessionTimelineProps {
  prompts: Prompt[];
}

export function SessionTimeline({ prompts }: SessionTimelineProps) {
  if (prompts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No prompts in this session.
      </p>
    );
  }

  const sorted = [...prompts].sort(
    (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
  );

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-zinc-700" />

      <div className="space-y-6">
        {sorted.map((prompt, idx) => (
          <div key={prompt.id} className="relative flex gap-4">
            {/* Dot */}
            <div className="absolute -left-6 top-1.5 flex h-[18px] w-[18px] items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-zinc-600 bg-zinc-900" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {prompt.timestamp && (
                  <span className="text-xs font-medium text-zinc-400">
                    {format(new Date(prompt.timestamp), "h:mm a")}
                  </span>
                )}
                {prompt.category && (
                  <CategoryBadge
                    category={prompt.category as PromptCategory}
                  />
                )}
                {prompt.model && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-500">
                    {prompt.model}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">
                {prompt.promptText
                  ? truncate(prompt.promptText, 180)
                  : "No prompt text"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
