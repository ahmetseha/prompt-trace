import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Clock,
  FolderOpen,
  Plug,
  TrendingUp,
  Target,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { ActivityChart } from '@/features/dashboard/activity-chart';
import { CategoryChart } from '@/features/dashboard/category-chart';
import { CategoryBadge } from '@/components/category-badge';
import { cn, truncate, formatRelativeDate } from '@/lib/utils';
import type { Prompt, TemplateCandidate, PromptCategory } from '@/lib/types';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.getPrompts(),
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: api.getTemplates,
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: api.getOpportunities,
    retry: 1,
  });

  const isLoading = statsLoading || promptsLoading || templatesLoading;

  if (isLoading || !stats || !prompts || !templates) return <PageLoader />;

  const allPrompts = prompts as Prompt[];
  const allTemplates = templates as TemplateCandidate[];

  const categoryData = Object.entries(stats.promptsByCategory || {})
    .filter(([cat]) => cat !== 'unknown')
    .map(([category, count]: [string, any]) => ({ category, count }))
    .sort((a: any, b: any) => b.count - a.count);

  // Compute opportunity data from local data as fallback
  const weakPrompts = allPrompts.filter(
    (p) => (p.successScore ?? 0) < 40 || (p.reuseScore ?? 0) < 30
  );
  const strongTemplates = allTemplates.filter(
    (t) => (t.reuseScore ?? 0) >= 0.7
  );

  // Compute weekly trend from promptsByDay
  const days = stats.promptsByDay || [];
  const thisWeekDays = days.slice(-7);
  const lastWeekDays = days.slice(-14, -7);
  const thisWeekAvg = thisWeekDays.length > 0
    ? Math.round(thisWeekDays.reduce((s: number, d: any) => s + d.count, 0) / thisWeekDays.length)
    : 0;
  const lastWeekAvg = lastWeekDays.length > 0
    ? Math.round(lastWeekDays.reduce((s: number, d: any) => s + d.count, 0) / lastWeekDays.length)
    : 0;
  const trendDiff = thisWeekAvg - lastWeekAvg;

  // Use API opportunities if available, otherwise use computed
  const oppWeakCount = opportunities?.weakPromptCount ?? weakPrompts.length;
  const oppStrongCount = opportunities?.strongTemplateCount ?? strongTemplates.length;
  const oppTrendValue = opportunities?.trendValue ?? trendDiff;
  const oppTrendLabel = opportunities?.trendLabel ?? 'prompts/day vs last week';

  // Top reusable templates - sorted by score desc
  const topTemplates = [...allTemplates]
    .sort((a, b) => (b.reuseScore ?? 0) - (a.reuseScore ?? 0))
    .slice(0, 5);

  // Weakest prompts needing improvement
  const weakestPrompts = [...allPrompts]
    .filter((p) => p.successScore != null)
    .sort((a, b) => (a.successScore ?? 100) - (b.successScore ?? 100))
    .slice(0, 5);

  // Recent high-value prompts
  const highValuePrompts = [...allPrompts]
    .filter((p) => (p.reuseScore ?? 0) > 50 || (p.successScore ?? 0) > 60)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats row */}
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

      {/* Optimization Opportunities */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Optimization Opportunities</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/dashboard/prompts?maxSuccessScore=40"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Weak Prompts</p>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
              {oppWeakCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Prompts with low optimization score
            </p>
          </Link>

          <Link
            to="/dashboard/templates"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Strong Templates</p>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
              {oppStrongCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              High-score templates ready to reuse
            </p>
          </Link>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Improvement Trend</p>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
              {oppTrendValue >= 0 ? '+' : ''}{oppTrendValue}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {oppTrendLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Activity + Category charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart data={stats.promptsByDay} />
        <CategoryChart data={categoryData} />
      </div>

      {/* Top Templates + Weakest Prompts + Top Projects */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Reusable Templates */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Top Reusable Templates</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Highest scoring patterns</p>
            </div>
            <Link
              to="/dashboard/templates"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2.5">
            {topTemplates.map((t) => {
              const pct = Math.round((t.reuseScore ?? 0) * 100);
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{t.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.category && <CategoryBadge category={t.category} />}
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        pct >= 70
                          ? "bg-emerald-500/10 text-emerald-400"
                          : pct >= 40
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-zinc-500/10 text-zinc-400"
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
            {topTemplates.length === 0 && (
              <p className="text-xs text-zinc-500 py-4 text-center">No templates yet</p>
            )}
          </div>
        </div>

        {/* Prompts Needing Improvement */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Prompts Needing Improvement</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Lowest optimization scores</p>
            </div>
          </div>
          <div className="space-y-2">
            {weakestPrompts.map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/prompts/${p.id}`}
                className="flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-zinc-300 line-clamp-1">
                    {truncate(p.promptText ?? '', 60)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {p.category && (
                      <CategoryBadge category={p.category as PromptCategory} />
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                  {Math.round(p.successScore ?? 0)}%
                </span>
              </Link>
            ))}
            {weakestPrompts.length === 0 && (
              <p className="text-xs text-zinc-500 py-4 text-center">No prompts to improve</p>
            )}
          </div>
        </div>

        {/* Top Projects */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-medium">Top Projects</h3>
          <p className="mt-0.5 text-xs text-zinc-500">By prompt volume</p>
          <div className="mt-4 space-y-3">
            {stats.topProjects.map((project: any) => (
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

      {/* Recent High-Value Prompts */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Recent High-Value Prompts</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Prompts with reuse score &gt; 50 or success score &gt; 60
            </p>
          </div>
          <Link
            to="/dashboard/prompts"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {highValuePrompts.map((p) => (
            <Link
              key={p.id}
              to={`/dashboard/prompts/${p.id}`}
              className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-zinc-200 line-clamp-1">
                  {truncate(p.promptText ?? '', 80)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  {p.category && (
                    <CategoryBadge category={p.category as PromptCategory} />
                  )}
                  <span className="text-[11px] text-zinc-500">
                    {p.timestamp ? formatRelativeDate(p.timestamp) : ''}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {(p.reuseScore ?? 0) > 50 && (
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Reusable
                  </span>
                )}
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
          {highValuePrompts.length === 0 && (
            <p className="col-span-2 text-xs text-zinc-500 py-8 text-center">
              No high-value prompts found yet. Keep using AI tools and sync to build your library.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
