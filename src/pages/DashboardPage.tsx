import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { DashboardContent } from '@/features/dashboard/dashboard-content';
import { api } from '@/lib/api';

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

  const isLoading = statsLoading || promptsLoading || templatesLoading;

  if (isLoading) return <PageLoader />;

  const categoryData = Object.entries(stats.promptsByCategory)
    .map(([category, count]: [string, any]) => ({ category, count }))
    .sort((a: any, b: any) => b.count - a.count);

  const sourceData = Object.entries(
    (prompts as any[]).reduce<Record<string, number>>((acc, p) => {
      const name = p.sourceId?.replace('src-', '') || 'unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const modelData = Object.entries(stats.promptsByModel)
    .map(([model, count]: [string, any]) => ({ model, count }))
    .sort((a: any, b: any) => b.count - a.count);

  return (
    <DashboardContent
      stats={stats}
      categoryData={categoryData}
      sourceData={sourceData}
      modelData={modelData}
      templates={templates}
    />
  );
}
