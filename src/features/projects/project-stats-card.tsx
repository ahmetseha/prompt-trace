import { Link } from "react-router-dom";
import { FolderOpen, MessageSquare, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import { CategoryBadge, getCategoryColor } from "@/components/category-badge";
import type { PromptCategory } from "@/lib/types";

export interface ProjectStatsData {
  id: string;
  name: string;
  path: string;
  totalPrompts: number;
  totalSessions: number;
  activeDays: number;
  lastActivity: number;
  mostUsedCategory: PromptCategory;
  categoryDistribution: { category: PromptCategory; count: number }[];
}

interface ProjectStatsCardProps {
  project: ProjectStatsData;
  className?: string;
}

export function ProjectStatsCard({ project, className }: ProjectStatsCardProps) {
  const maxCount = Math.max(...project.categoryDistribution.map((d) => d.count), 1);

  return (
    <Link to={`/dashboard/projects/${project.id}`} className="block">
      <div
        className={cn(
          "rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {project.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500 font-mono">
              {project.path}
            </p>
          </div>
          <FolderOpen className="h-4 w-4 shrink-0 text-zinc-500" />
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <MessageSquare className="h-3 w-3" />
              <span className="text-[11px]">Prompts</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-100">
              {project.totalPrompts}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <Clock className="h-3 w-3" />
              <span className="text-[11px]">Sessions</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-100">
              {project.totalSessions}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-zinc-500">
              <CalendarDays className="h-3 w-3" />
              <span className="text-[11px]">Active Days</span>
            </div>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-100">
              {project.activeDays}
            </p>
          </div>
        </div>

        {/* Category distribution bar chart */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Categories</span>
            <CategoryBadge category={project.mostUsedCategory} />
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {project.categoryDistribution.slice(0, 5).map((d) => (
              <div
                key={d.category}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max((d.count / maxCount) * 100, 8)}%`,
                  backgroundColor: getCategoryColor(d.category),
                  opacity: 0.7,
                }}
                title={`${d.category}: ${d.count}`}
              />
            ))}
          </div>
          {project.categoryDistribution.length > 5 && (
            <p className="mt-1 text-[10px] text-zinc-600">
              and {project.categoryDistribution.length - 5} more
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
          <span className="text-[11px] text-zinc-500">Last activity</span>
          <span className="text-[11px] text-zinc-400">
            {formatRelativeDate(project.lastActivity)}
          </span>
        </div>
      </div>
    </Link>
  );
}
