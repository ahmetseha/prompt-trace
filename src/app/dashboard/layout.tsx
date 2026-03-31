import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import { isDemoMode } from "@/lib/demo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = isDemoMode();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isDemo={isDemo} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
