import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { TemplateCard } from '@/features/templates/template-card';
import { api } from '@/lib/api';
import { Sparkles } from 'lucide-react';

export function TemplatesPage() {
  const { data: allTemplates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: api.getTemplates,
  });

  if (isLoading) return <PageLoader />;

  const templates = [...(allTemplates || [])].sort(
    (a: any, b: any) => (b.reuseScore ?? 0) - (a.reuseScore ?? 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {templates.length} reusable prompt template{templates.length !== 1 ? 's' : ''} detected from your history
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-indigo-950/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-sm text-zinc-400 leading-relaxed">
            <span className="text-zinc-200 font-medium">What are templates?</span>{" "}
            PromptTrace analyzes your prompt history and automatically detects patterns
            you use repeatedly. Templates are prompts that are generic enough to be
            reused across different projects. The higher the reuse score, the more
            versatile the prompt pattern is. Use these as starting points for your
            next AI interactions.
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No templates detected yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Templates are extracted after scanning your prompt history. Use the Sync button to scan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template: any) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
