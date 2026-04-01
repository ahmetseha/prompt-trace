import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  MessageSquare,
  Clock,
  FolderOpen,
  FileText,
  Search,
  LayoutDashboard,
  Plug,
  Settings,
} from "lucide-react";
// TODO: Refactor to use data provider from @/lib/data instead of direct demo imports.
// Since this is a client component, it would need either an API route or props from a server layout.
import { demoPrompts, demoSessions, demoProjects } from "@/lib/demo/data";
import { truncate } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const routerNavigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      routerNavigate(path);
    },
    [routerNavigate]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command
          className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          label="Search PromptTrace"
        >
          <div className="flex items-center border-b border-zinc-800 px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
            <Command.Input
              placeholder="Search prompts, sessions, projects..."
              className="h-12 w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="px-2 py-1.5 text-xs font-medium text-zinc-500"
            >
              <Command.Item
                onSelect={() => navigate("/dashboard")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                Overview
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/prompts")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <MessageSquare className="h-4 w-4 text-zinc-500" />
                Prompts
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/sessions")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <Clock className="h-4 w-4 text-zinc-500" />
                Sessions
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/projects")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <FolderOpen className="h-4 w-4 text-zinc-500" />
                Projects
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/templates")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <FileText className="h-4 w-4 text-zinc-500" />
                Templates
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/sources")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <Plug className="h-4 w-4 text-zinc-500" />
                Sources
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/dashboard/settings")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
              >
                <Settings className="h-4 w-4 text-zinc-500" />
                Settings
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-zinc-800" />

            <Command.Group
              heading="Recent Prompts"
              className="px-2 py-1.5 text-xs font-medium text-zinc-500"
            >
              {demoPrompts
                .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
                .slice(0, 5)
                .map((prompt) => (
                  <Command.Item
                    key={prompt.id}
                    value={prompt.promptText ?? ""}
                    onSelect={() =>
                      navigate(`/dashboard/prompts/${prompt.id}`)
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span className="truncate">
                      {truncate(prompt.promptText ?? "", 60)}
                    </span>
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-zinc-800" />

            <Command.Group
              heading="Sessions"
              className="px-2 py-1.5 text-xs font-medium text-zinc-500"
            >
              {demoSessions.slice(0, 4).map((session) => (
                <Command.Item
                  key={session.id}
                  value={session.title || session.id}
                  onSelect={() =>
                    navigate(`/dashboard/sessions/${session.id}`)
                  }
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  {session.title}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-zinc-800" />

            <Command.Group
              heading="Projects"
              className="px-2 py-1.5 text-xs font-medium text-zinc-500"
            >
              {demoProjects.map((project) => (
                <Command.Item
                  key={project.id}
                  value={project.name}
                  onSelect={() =>
                    navigate(`/dashboard/projects/${project.id}`)
                  }
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800"
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="border-t border-zinc-800 px-4 py-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-600">
              <span>Navigate with arrow keys</span>
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5">
                  Enter
                </kbd>
                <span>to select</span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
