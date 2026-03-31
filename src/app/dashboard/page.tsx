import { DashboardContent } from "@/features/dashboard/dashboard-content";
import { getStats, getAllPrompts, getAllTemplates } from "@/lib/data";

export default async function DashboardPage() {
  const [stats, prompts, templates] = await Promise.all([
    getStats(),
    getAllPrompts(),
    getAllTemplates(),
  ]);

  const categoryData = Object.entries(stats.promptsByCategory)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const sourceData = Object.entries(
    prompts.reduce<Record<string, number>>((acc, p) => {
      const name = p.sourceId?.replace("src-", "") || "unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const modelData = Object.entries(stats.promptsByModel)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count);

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
