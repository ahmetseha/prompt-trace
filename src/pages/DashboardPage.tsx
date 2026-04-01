import { PageLoader } from "@/components/page-loader";
import { useQuery } from '@tanstack/react-query';
import { DashboardContent } from '@/features/dashboard/dashboard-content';
import { api } from '@/lib/api';

const SOURCE_NAMES: Record<string, string> = {
  'src-claude-code': 'Claude Code',
  'src-cursor': 'Cursor',
  'src-cursor-agent': 'Cursor Agent',
  'src-codex-cli': 'Codex CLI',
  'src-vscode': 'VS Code',
  'src-vscode-insiders': 'VS Code Insiders',
  'src-copilot-cli': 'Copilot CLI',
  'src-windsurf': 'Windsurf',
  'src-windsurf-next': 'Windsurf Next',
  'src-gemini-cli': 'Gemini CLI',
  'src-zed': 'Zed',
  'src-antigravity': 'Antigravity',
  'src-opencode': 'OpenCode',
  'src-goose': 'Goose',
  'src-kiro': 'Kiro',
  'src-command-code': 'Command Code',
};

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

  if (isLoading || !stats || !prompts || !templates) return <PageLoader />;

  const categoryData = Object.entries(stats.promptsByCategory || {})
    .filter(([cat]) => cat !== 'unknown')
    .map(([category, count]: [string, any]) => ({ category, count }))
    .sort((a: any, b: any) => b.count - a.count);

  const sourceData = Object.entries(
    (prompts as any[]).reduce<Record<string, number>>((acc, p) => {
      const name = SOURCE_NAMES[p.sourceId] || p.sourceId || 'Other';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const modelData = Object.entries(stats.promptsByModel || {})
    .filter(([model]) => model && model !== '')
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
