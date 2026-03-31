"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Overview",
    description: "Your AI prompting activity at a glance",
  },
  "/dashboard/prompts": {
    title: "Prompts",
    description: "Search and explore your prompt history",
  },
  "/dashboard/sessions": {
    title: "Sessions",
    description: "Browse AI interaction sessions",
  },
  "/dashboard/projects": {
    title: "Projects",
    description: "Prompt activity by project",
  },
  "/dashboard/templates": {
    title: "Templates",
    description: "Reusable prompt patterns extracted from your history",
  },
  "/dashboard/sources": {
    title: "Sources",
    description: "Connected AI tools and import sources",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure PromptTrace preferences",
  },
};

export function TopBar() {
  const pathname = usePathname();

  const matchedKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));

  const page = matchedKey
    ? pageTitles[matchedKey]
    : { title: "PromptTrace", description: "" };

  return (
    <header className="flex h-14 items-center border-b border-zinc-800 px-6">
      <div>
        <h1 className="text-sm font-semibold">{page.title}</h1>
        {page.description && (
          <p className="text-xs text-zinc-500">{page.description}</p>
        )}
      </div>
    </header>
  );
}
