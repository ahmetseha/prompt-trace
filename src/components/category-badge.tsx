import { cn } from "@/lib/utils";
import type { PromptCategory } from "@/lib/types";

const categoryConfig: Record<
  PromptCategory,
  { label: string; className: string }
> = {
  "bug-fixing": {
    label: "Bug Fix",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  refactor: {
    label: "Refactor",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  architecture: {
    label: "Architecture",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  "code-generation": {
    label: "Code Gen",
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  debugging: {
    label: "Debugging",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  styling: {
    label: "Styling",
    className: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  testing: {
    label: "Testing",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  documentation: {
    label: "Docs",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  deployment: {
    label: "Deploy",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  "data-backend": {
    label: "Data/API",
    className: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  performance: {
    label: "Perf",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  exploratory: {
    label: "Explore",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  review: {
    label: "Review",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  unknown: {
    label: "Other",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

interface CategoryBadgeProps {
  category: PromptCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? categoryConfig.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getCategoryColor(category: PromptCategory): string {
  const colors: Record<PromptCategory, string> = {
    "bug-fixing": "#ef4444",
    refactor: "#8b5cf6",
    architecture: "#3b82f6",
    "code-generation": "#6366f1",
    debugging: "#f97316",
    styling: "#ec4899",
    testing: "#10b981",
    documentation: "#06b6d4",
    deployment: "#eab308",
    "data-backend": "#14b8a6",
    performance: "#f59e0b",
    exploratory: "#a78bfa",
    review: "#64748b",
    unknown: "#71717a",
  };
  return colors[category] ?? colors.unknown;
}
