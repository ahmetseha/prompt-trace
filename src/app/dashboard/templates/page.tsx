import { getAllTemplates } from "@/lib/data";
import { TemplateCard } from "@/features/templates/template-card";

export default async function TemplatesPage() {
  const allTemplates = await getAllTemplates();

  const templates = [...allTemplates].sort(
    (a, b) => (b.reuseScore ?? 0) - (a.reuseScore ?? 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {templates.length} reusable prompt template{templates.length !== 1 ? "s" : ""} detected from your history
        </p>
      </div>

      <div className="space-y-4">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
