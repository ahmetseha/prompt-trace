import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { SessionCard } from '@/features/sessions/session-card';
import { api } from '@/lib/api';

export function SessionsPage() {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const isLoading = sessionsLoading || projectsLoading;

  if (isLoading) return <PageLoader />;

  const sorted = [...sessions].sort(
    (a: any, b: any) => (b.startedAt ?? b.createdAt) - (a.startedAt ?? a.createdAt)
  );

  const projectMap = new Map(projects.map((p: any) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Sessions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sessions.length} sessions total
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {sorted.map((session: any) => (
          <SessionCard
            key={session.id}
            session={session}
            project={
              session.projectId
                ? projectMap.get(session.projectId)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
