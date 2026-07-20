"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "grid";

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/tools?${params.toString()}`);
  };

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setView("grid")}
        className={cn(
          "inline-flex items-center justify-center rounded-l-lg p-2 transition-colors",
          currentView === "grid"
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-600"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => setView("list")}
        className={cn(
          "inline-flex items-center justify-center rounded-r-lg p-2 transition-colors",
          currentView === "list"
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-600"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
