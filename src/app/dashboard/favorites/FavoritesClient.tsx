"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/components/tools/FavoriteButton";
import ReserveDialog from "@/components/reservations/ReserveDialog";
import type { Favorite, Tool } from "@/db/schema";

interface Props {
  favorites: { favorite: Favorite; tool: Tool }[];
}

export default function FavoritesClient({ favorites }: Props) {
  const router = useRouter();
  const [reserveTool, setReserveTool] = useState<Tool | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map(({ tool }) => (
          <div
            key={tool.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
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
                initialFavorited={true}
                onToggle={() => router.refresh()}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  tool.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tool.status}
              </span>
              {tool.skillLevel && (
                <span className="text-xs text-slate-400">
                  {tool.skillLevel}
                </span>
              )}
            </div>
            {tool.status === "available" && (
              <button
                onClick={() => setReserveTool(tool)}
                className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Quick Reserve
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
