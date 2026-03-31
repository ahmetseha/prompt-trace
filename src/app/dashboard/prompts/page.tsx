import {
  getAllPrompts,
  getAllSources,
  getAllProjects,
} from "@/lib/data";
import { PromptsExplorer } from "@/features/prompts/prompts-explorer";

export default async function PromptsPage() {
  const [prompts, sources, projects] = await Promise.all([
    getAllPrompts(),
    getAllSources(),
    getAllProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Prompts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse and search all captured prompts across your AI coding tools.
        </p>
      </div>

      <PromptsExplorer
        prompts={prompts}
        sources={sources}
        projects={projects}
        promptFiles={[]}
      />
    </div>
  );
}
