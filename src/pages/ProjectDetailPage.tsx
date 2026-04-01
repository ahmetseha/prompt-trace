import { PageLoader } from "@/components/page-loader";
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FolderOpen, MessageSquare, Clock, CalendarDays, FileText } from 'lucide-react';
import { formatDate, formatRelativeDate, truncate } from '@/lib/utils';
import { CategoryBadge } from '@/components/category-badge';
import { SourceIcon } from '@/components/source-icon';
import { api } from '@/lib/api';
import type { PromptCategory, SourceType } from '@/lib/types';

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-zinc-100">{value}</p>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProjectById(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;

  if (!projectData?.project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-zinc-500">Project not found.</p>
        <Link
          to="/dashboard/projects"
          className="mt-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const { project, prompts: projectPrompts = [], sessions: projectSessions = [], files: relevantFiles = [] } = projectData;

  // Active days
  const uniqueDates = new Set(
    projectPrompts
      .filter((p: any) => p.timestamp)
      .map((p: any) => new Date(p.timestamp!).toISOString().slice(0, 10))
  );

  // Avg prompt length
  const promptLengths = projectPrompts
    .filter((p: any) => p.promptLength != null)
    .map((p: any) => p.promptLength!);
  const avgPromptLength =
    promptLengths.length > 0
      ? Math.round(promptLengths.reduce((a: number, b: number) => a + b, 0) / promptLengths.length)
      : 0;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const p of projectPrompts) {
    const cat = (p as any).category ?? 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category: category as PromptCategory, count }))
    .sort((a, b) => b.count - a.count);

  // Top files
  const fileCounts: Record<string, number> = {};
  for (const f of relevantFiles) {
    fileCounts[(f as any).filePath] = (fileCounts[(f as any).filePath] || 0) + 1;
  }
  const topFiles = Object.entries(fileCounts)
    .map(([filePath, count]) => ({ filePath, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent prompts
  const recentPrompts = [...projectPrompts]
    .sort((a: any, b: any) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, 10);

  // Sessions sorted
  const sortedSessions = [...projectSessions].sort(
    (a: any, b: any) => (b.startedAt ?? 0) - (a.startedAt ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-5 w-5 text-zinc-500" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">{project.name}</h1>
            <p className="mt-0.5 text-sm font-mono text-zinc-500">{project.path}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
              {project.firstSeenAt && (
                <span>First seen: {formatDate(project.firstSeenAt, 'MMM d, yyyy')}</span>
              )}
              {project.lastSeenAt && (
                <span>Last seen: {formatRelativeDate(project.lastSeenAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock icon={MessageSquare} label="Total Prompts" value={projectPrompts.length} />
        <StatBlock icon={Clock} label="Sessions" value={projectSessions.length} />
        <StatBlock icon={CalendarDays} label="Active Days" value={uniqueDates.size} />
        <StatBlock icon={FileText} label="Avg Length" value={`${avgPromptLength} chars`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-medium text-zinc-300">Category Breakdown</h2>
          <div className="mt-3 space-y-2">
            {categoryBreakdown.map(({ category, count }) => {
              const pct = projectPrompts.length
                ? Math.round((count / projectPrompts.length) * 100)
                : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <CategoryBadge category={category} className="w-20 justify-center" />
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-zinc-800">
                      <div
                        className="h-1.5 rounded-full bg-zinc-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top files */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-medium text-zinc-300">Top Files</h2>
          {topFiles.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">No file references found.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {topFiles.map(({ filePath, count }) => (
                <div
                  key={filePath}
                  className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-1.5"
                >
                  <span className="truncate text-xs font-mono text-zinc-400">
                    {filePath}
                  </span>
                  <span className="ml-2 shrink-0 text-[11px] text-zinc-500">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent prompts */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-medium text-zinc-300">Recent Prompts</h2>
        <div className="mt-3 space-y-2">
          {recentPrompts.map((prompt: any) => {
            const sourceType = prompt.sourceId
              ? (prompt.sourceId.replace('src-', '') as SourceType)
              : undefined;
            return (
              <div
                key={prompt.id}
                className="flex items-start gap-3 rounded-lg bg-zinc-950 px-3 py-2.5"
              >
                {sourceType && <SourceIcon type={sourceType} className="mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-300">
                    {truncate(prompt.promptText ?? '\u2014', 120)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {prompt.category && <CategoryBadge category={prompt.category} />}
                    {prompt.timestamp && (
                      <span className="text-[11px] text-zinc-600">
                        {formatRelativeDate(prompt.timestamp)}
                      </span>
                    )}
                    {prompt.model && (
                      <span className="text-[11px] text-zinc-600">{prompt.model}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-medium text-zinc-300">Sessions</h2>
        <div className="mt-3 space-y-2">
          {sortedSessions.map((session: any) => {
            const sourceType = session.sourceId
              ? (session.sourceId.replace('src-', '') as SourceType)
              : undefined;
            return (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sourceType && <SourceIcon type={sourceType} />}
                  <span className="truncate text-xs text-zinc-300">
                    {session.title ?? session.id}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[11px] text-zinc-500">
                    {session.promptCount} prompt{session.promptCount !== 1 ? 's' : ''}
                  </span>
                  {session.startedAt && (
                    <span className="text-[11px] text-zinc-600">
                      {formatRelativeDate(session.startedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
