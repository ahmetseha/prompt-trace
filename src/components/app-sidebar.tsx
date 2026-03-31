"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Clock,
  FolderOpen,
  FileText,
  Plug,
  Settings,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prompts", href: "/dashboard/prompts", icon: MessageSquare },
  { name: "Sessions", href: "/dashboard/sessions", icon: Clock },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Templates", href: "/dashboard/templates", icon: FileText },
  { name: "Sources", href: "/dashboard/sources", icon: Plug },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface AppSidebarProps {
  isDemo?: boolean;
}

export function AppSidebar({ isDemo = false }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          PromptTrace
        </span>
        {isDemo && (
          <span className="ml-auto rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            DEMO
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300">
          <Search className="h-3.5 w-3.5" />
          <span>Search prompts...</span>
          <kbd className="ml-auto rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] font-medium text-zinc-500">
            /
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {isDemo && (
        <div className="border-t border-zinc-800 p-3">
          <div className="rounded-lg bg-zinc-900 p-3">
            <p className="text-xs font-medium text-zinc-300">
              Demo Mode Active
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Viewing sample data. Connect real sources in Settings to analyze
              your prompts.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
