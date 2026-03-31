import {
  getAllPrompts,
  getAllSources,
  getAllProjects,
  getProjectFiles,
} from "@/lib/data";
import { demoPromptFiles } from "@/lib/demo/data";
import { isDemoMode } from "@/lib/demo";
import { PromptsExplorer } from "@/features/prompts/prompts-explorer";

export default async function PromptsPage() {
  const [prompts, sources, projects] = await Promise.all([
    getAllPrompts(),
    getAllSources(),
    getAllProjects(),
  ]);

  // For prompt files, in demo mode use the full array; in DB mode, we'd need
  // a different approach. For now, pass demo files when in demo mode.
  // TODO: Add a getAllPromptFiles() query for DB mode
  const promptFiles = isDemoMode() ? demoPromptFiles : demoPromptFiles;

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
        promptFiles={promptFiles}
      />
    </div>
  );
}
