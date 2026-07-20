import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatStatus } from "@/lib/utils";
import type { ToolWithRelations } from "@/lib/types";

interface RelatedToolsProps {
  tools: ToolWithRelations[];
  categoryName: string;
}

export function RelatedTools({ tools, categoryName }: RelatedToolsProps) {
  if (tools.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Related Tools</h2>
          <p className="mt-1 text-slate-500">
            More {categoryName.toLowerCase()} tools you might like
          </p>
        </div>
        <Link
          href={`/tools?category=${tools[0]?.category.slug}`}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-slate-300"
          >
            {/* Image */}
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
              <div className="absolute top-3 right-3">
                <Badge className={getStatusColor(tool.status)}>
                  {formatStatus(tool.status)}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-base font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {tool.name}
              </h3>
              {tool.brand && (
                <p className="mt-0.5 text-sm text-slate-500">{tool.brand}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href={`/tools?category=${tools[0]?.category.slug}`}
        className="mt-6 sm:hidden flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all {categoryName.toLowerCase()} tools
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
