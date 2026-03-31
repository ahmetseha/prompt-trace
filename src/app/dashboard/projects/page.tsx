import {
  getAllProjects,
  getAllPrompts,
  getAllSessions,
} from "@/lib/data";
import { ProjectStatsCard, type ProjectStatsData } from "@/features/projects/project-stats-card";
import type { PromptCategory } from "@/lib/types";
import type { Prompt, Session, Project } from "@/lib/types";

function computeProjectStats(
  projects: Project[],
  prompts: Prompt[],
  sessions: Session[],
): ProjectStatsData[] {
  return projects.map((project) => {
    const projectPrompts = prompts.filter((p) => p.projectId === project.id);
    const projectSessions = sessions.filter((s) => s.projectId === project.id);

    // Active days: unique dates from prompt timestamps
    const uniqueDates = new Set(
      projectPrompts
        .filter((p) => p.timestamp)
        .map((p) => new Date(p.timestamp!).toISOString().slice(0, 10))
    );

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const p of projectPrompts) {
      const cat = p.category ?? "unknown";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category: category as PromptCategory, count }))
      .sort((a, b) => b.count - a.count);

    const mostUsedCategory: PromptCategory =
      categoryDistribution.length > 0 ? categoryDistribution[0].category : "unknown";

    // Last activity
    const lastActivity = project.lastSeenAt ?? project.updatedAt;

    return {
      id: project.id,
      name: project.name,
      path: project.path,
      totalPrompts: projectPrompts.length,
      totalSessions: projectSessions.length,
      activeDays: uniqueDates.size,
      lastActivity,
      mostUsedCategory,
      categoryDistribution,
    };
  });
}

export default async function ProjectsPage() {
  const [allProjects, allPrompts, allSessions] = await Promise.all([
    getAllProjects(),
    getAllPrompts(),
    getAllSessions(),
  ]);

  const projects = computeProjectStats(allProjects, allPrompts, allSessions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Projects</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {projects.length} project{projects.length !== 1 ? "s" : ""} tracked across all sources
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectStatsCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
