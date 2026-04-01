import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { SourceCard } from '@/features/sources/source-card';
import { DiscoverSources } from '@/features/sources/discover-sources';
import { Plug } from 'lucide-react';
import { api } from '@/lib/api';

export function SourcesPage() {
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSources,
  });

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.getPrompts(),
  });

  const isLoading = sourcesLoading || promptsLoading;

  if (isLoading) return <PageLoader />;

  const promptCountBySource = (prompts as any[]).reduce<Record<string, number>>(
    (acc, p) => {
      if (p.sourceId) acc[p.sourceId] = (acc[p.sourceId] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Sources</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sources.length > 0
              ? `${sources.length} source${sources.length !== 1 ? 's' : ''} connected.`
              : 'No sources scanned yet. Run npx prompttrace to scan your AI tools.'}
          </p>
        </div>
        {sources.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5">
            <Plug className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">
              {prompts.length} prompts
            </span>
          </div>
        )}
      </div>

      {sources.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source: any) => (
            <SourceCard
              key={source.id}
              source={source}
              promptCount={promptCountBySource[source.id] ?? 0}
            />
          ))}
        </div>
      )}

      <DiscoverSources hasExistingSources={sources.length > 0} />
    </div>
  );
}
