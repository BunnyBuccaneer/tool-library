import { PackageOpen } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  message?: string;
  showReset?: boolean;
}

export function EmptyState({
  title = "No tools found",
  message = "Try adjusting your search or filter criteria.",
  showReset = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16 px-8 text-center">
      <PackageOpen className="h-12 w-12 text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-md">{message}</p>
      {showReset && (
        <Link
          href="/tools"
          className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Clear All Filters
        </Link>
      )}
    </div>
  );
}
