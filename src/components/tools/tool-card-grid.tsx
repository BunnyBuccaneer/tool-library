import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  getSkillLevelColor,
  getStatusColor,
  formatStatus,
  formatSkillLevel,
} from "@/lib/utils";
import type { ToolWithRelations } from "@/lib/types";
import { Wrench, MapPin } from "lucide-react";

interface ToolCardGridProps {
  tool: ToolWithRelations;
}

export function ToolCardGrid({ tool }: ToolCardGridProps) {
  const isAvailable = tool.status === "available";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-slate-300">
      {/* Image */}
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {tool.imageUrl ? (
            <img
              src={tool.imageUrl}
              alt={tool.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Wrench className="h-12 w-12 text-slate-300" />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-3 right-3">
            <Badge className={getStatusColor(tool.status)}>
              {formatStatus(tool.status)}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600 mb-1">
          {tool.category.name}
        </p>

        {/* Name */}
        <Link href={`/tools/${tool.slug}`}>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {tool.name}
          </h3>
        </Link>

        {/* Brand */}
        {tool.brand && (
          <p className="mt-0.5 text-sm text-slate-500">{tool.brand}</p>
        )}

        {/* Location - displays which branch has this tool */}
        {tool.location && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            <span>{tool.location.name}</span>
            {tool.location.city && (
              <span className="text-slate-300">· {tool.location.city}</span>
            )}
          </div>
        )}

        {/* Skill Level */}
        <div className="mt-3 flex items-center gap-2">
          <Badge className={getSkillLevelColor(tool.skillLevel ?? "")}>
            {formatSkillLevel(tool.skillLevel ?? "")}
          </Badge>
        </div>

        {/* Reserve button */}
        <div className="mt-auto pt-4">
          {isAvailable ? (
            <Link
              href={`/tools/${tool.slug}`}
              className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Reserve
            </Link>
          ) : (
            <span className="block w-full rounded-lg bg-slate-100 py-2 text-center text-sm font-medium text-slate-400 cursor-not-allowed">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
