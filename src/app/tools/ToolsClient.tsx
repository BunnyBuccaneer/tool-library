"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/components/tools/FavoriteButton";
import ReserveDialog from "@/components/reservations/ReserveDialog";

interface ToolItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  status: string;
  skillLevel: string | null;
  categoryName: string | null;
  isFavorited: boolean;
}

interface Props {
  tools: ToolItem[];
}

export default function ToolsClient({ tools }: Props) {
  const router = useRouter();
  const [reserveTool, setReserveTool] = useState<ToolItem | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.brand?.toLowerCase().includes(filter.toLowerCase()) ||
      t.categoryName?.toLowerCase().includes(filter.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    checked_out: "bg-purple-100 text-purple-700",
    reserved: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-slate-100 text-slate-500",
  };

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tools..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <div
            key={tool.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 truncate">
                  {tool.name}
                </h3>
                {tool.brand && (
                  <p className="text-sm text-slate-500">
                    {tool.brand} {tool.model ?? ""}
                  </p>
                )}
              </div>
              <FavoriteButton
                toolId={tool.id}
                initialFavorited={tool.isFavorited}
                onToggle={() => router.refresh()}
              />
            </div>

            {tool.description && (
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                {tool.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusColors[tool.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {tool.status.replace("_", " ")}
              </span>
              {tool.categoryName && (
                <span className="text-xs text-slate-400">
                  {tool.categoryName}
                </span>
              )}
              {tool.skillLevel && (
                <span className="text-xs text-slate-400">
                  • {tool.skillLevel}
                </span>
              )}
            </div>

            {tool.status === "available" && (
              <button
                onClick={() => setReserveTool(tool)}
                className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Reserve Tool
              </button>
            )}
          </div>
        ))}
      </div>

      {reserveTool && (
        <ReserveDialog
          toolId={reserveTool.id}
          toolName={reserveTool.name}
          open={true}
          onClose={() => setReserveTool(null)}
          onSuccess={() => {
            setReserveTool(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
