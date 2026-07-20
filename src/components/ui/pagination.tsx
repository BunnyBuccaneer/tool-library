import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationInfo } from "@/lib/types";

interface PaginationProps {
  pagination: PaginationInfo;
  buildUrl: (page: number) => string;
  className?: string;
}

export function Pagination({ pagination, buildUrl, className }: PaginationProps) {
  const { currentPage, totalPages, totalItems } = pagination;

  if (totalPages <= 1) return null;

  // Build page numbers to show
  const pages: (number | "ellipsis")[] = [];
  const delta = 2;
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (rangeStart > 2) pages.push("ellipsis");
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }
  if (rangeEnd < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <nav
      className={cn("flex items-center justify-between", className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-medium">
          {(currentPage - 1) * pagination.itemsPerPage + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium">
          {Math.min(currentPage * pagination.itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="font-medium">{totalItems}</span> tools
      </p>

      <div className="flex items-center gap-1">
        {pagination.hasPrevPage ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm text-slate-300 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        {pages.map((page, idx) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <Link
              key={page}
              href={buildUrl(page)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {page}
            </Link>
          )
        )}

        {pagination.hasNextPage ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 p-2 text-sm text-slate-300 cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
