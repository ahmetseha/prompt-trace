import { getAllSessions, getAllProjects } from "@/lib/data";
import { SessionCard } from "@/features/sessions/session-card";

export default async function SessionsPage() {
  const [sessions, projects] = await Promise.all([
    getAllSessions(),
    getAllProjects(),
  ]);

  const sorted = [...sessions].sort(
    (a, b) => (b.startedAt ?? b.createdAt) - (a.startedAt ?? a.createdAt)
  );

  const projectMap = new Map(projects.map((p) => [p.id, p]));

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
        {sorted.map((session) => (
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
