import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

function Tooltip({ content, side = "top", children, className, ...props }: TooltipProps) {
  const sideClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("group relative inline-flex", className)} {...props}>
      {children}
      <span
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 shadow-md group-hover:block",
          sideClasses[side]
        )}
        role="tooltip"
      >
        {content}
      </span>
    </div>
  );
}

export { Tooltip };
export type { TooltipProps };
