import { useQuery } from '@tanstack/react-query';
import { PromptsExplorer } from '@/features/prompts/prompts-explorer';
import { api } from '@/lib/api';

export function PromptsPage() {
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.getPrompts(),
  });

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSources,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const isLoading = promptsLoading || sourcesLoading || projectsLoading;

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

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
