import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  getSkillLevelColor,
  getStatusColor,
  formatStatus,
  formatSkillLevel,
} from "@/lib/utils";
import type { ToolWithRelations } from "@/lib/types";
import { Wrench, ChevronRight, MapPin } from "lucide-react";

interface ToolCardListProps {
  tool: ToolWithRelations;
}

export function ToolCardList({ tool }: ToolCardListProps) {
  const isAvailable = tool.status === "available";

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-slate-300">
      {/* Image */}
      <Link href={`/tools/${tool.slug}`} className="flex-shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
          {tool.imageUrl ? (
            <img
              src={tool.imageUrl}
              alt={tool.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Wrench className="h-8 w-8 text-slate-300" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {tool.category.name}
          </p>
          <Badge className={getStatusColor(tool.status)}>
            {formatStatus(tool.status)}
          </Badge>
          <Badge className={getSkillLevelColor(tool.skillLevel ?? "")}>
            {formatSkillLevel(tool.skillLevel ?? "")}
          </Badge>
        </div>

        <Link href={`/tools/${tool.slug}`}>
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {tool.name}
          </h3>
        </Link>

        {tool.brand && (
          <p className="text-sm text-slate-500">
            {tool.brand}
            {tool.model ? ` · ${tool.model}` : ""}
          </p>
        )}

        {/* Location - shows which branch from your multi-location system */}
        {tool.location && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span>
              {tool.location.name}
              {tool.location.city && `, ${tool.location.city}`}
              {tool.location.state && `, ${tool.location.state}`}
            </span>
          </div>
        )}

        {tool.description && (
          <p className="text-sm text-slate-500 line-clamp-1 hidden sm:block">
            {tool.description}
          </p>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0 flex items-center gap-3">
        {isAvailable ? (
          <Link
            href={`/tools/${tool.slug}`}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Reserve
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed">
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}
