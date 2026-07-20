"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
}

export function Pagination({ currentPage, totalPages, total }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/projects?${params.toString()}`;
  };

  const pages: (number | "...")[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Show ellipsis if current page is far from start
  if (currentPage > 3) {
    pages.push("...");
  }
  
  // Show pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  
  // Show ellipsis if current page is far from end
  if (currentPage < totalPages - 2) {
    pages.push("...");
  }
  
  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
      <p className="text-sm text-slate-600">
        Showing page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span> ({total} projects)
      </p>

      <nav className="flex items-center gap-1">
        {/* Previous */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400">
            Previous
          </span>
        )}

        {/* Page numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <Link
                key={page}
                href={createPageUrl(page)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </Link>
            )
          )}
        </div>

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400">
            Next
          </span>
        )}
      </nav>
    </div>
  );
}
