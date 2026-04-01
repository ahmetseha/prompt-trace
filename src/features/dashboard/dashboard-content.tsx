import {
  MessageSquare,
  Clock,
  FolderOpen,
  Plug,
  TrendingUp,
  Target,
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { ActivityChart } from "@/features/dashboard/activity-chart";
import { CategoryChart } from "@/features/dashboard/category-chart";
import { SourceChart } from "@/features/dashboard/source-chart";
import { ModelChart } from "@/features/dashboard/model-chart";
import { RecentPrompts } from "@/features/dashboard/recent-prompts";
import { TopTemplates } from "@/features/dashboard/top-templates";
import type { Prompt, TemplateCandidate } from "@/lib/types";

interface DashboardStats {
  totalPrompts: number;
  totalSessions: number;
  totalProjects: number;
  totalSources: number;
  avgReuseScore: number;
  avgSuccessScore: number;
  promptsByDay: { date: string; count: number }[];
  promptsByCategory: Record<string, number>;
  promptsByModel: Record<string, number>;
  topProjects: { id: string; name: string; promptCount: number }[];
  recentPrompts: Prompt[];
}

interface DashboardContentProps {
  stats: DashboardStats;
  categoryData: { category: string; count: number }[];
  sourceData: { source: string; count: number }[];
  modelData: { model: string; count: number }[];
  templates: TemplateCandidate[];
}

export function DashboardContent({
  stats,
  categoryData,
  sourceData,
  modelData,
  templates,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Prompts"
          value={stats.totalPrompts}
          icon={MessageSquare}
          trend={{ value: 12, label: "vs last week" }}
        />
        <StatsCard
          title="Sessions"
          value={stats.totalSessions}
          icon={Clock}
          description="Across all sources"
        />
        <StatsCard
          title="Projects"
          value={stats.totalProjects}
          icon={FolderOpen}
          description="Active projects tracked"
        />
        <StatsCard
          title="Sources"
          value={stats.totalSources}
          icon={Plug}
          description="Connected AI tools"
        />
        <StatsCard
          title="Avg Reuse Score"
          value={`${Math.round(stats.avgReuseScore)}%`}
          icon={Target}
          trend={{ value: 5, label: "improving" }}
        />
        <StatsCard
          title="Success Rate"
          value={`${Math.round(stats.avgSuccessScore)}%`}
          icon={TrendingUp}
          description="Estimated from heuristics"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={stats.promptsByDay} />
        <CategoryChart data={categoryData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SourceChart data={sourceData} />
        <ModelChart data={modelData} />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-medium">Top Projects</h3>
          <p className="mt-0.5 text-xs text-zinc-500">By prompt volume</p>
          <div className="mt-4 space-y-3">
            {stats.topProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate text-sm text-zinc-300">{project.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(Math.round((project.promptCount / stats.totalPrompts) * 100), 100)}%`,
                      }}
                    />
                  </div>
                  <span className="min-w-[2rem] text-right text-xs text-zinc-400">
                    {project.promptCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentPrompts prompts={stats.recentPrompts} />
        <TopTemplates templates={templates} />
      </div>
    </div>
  );
}
