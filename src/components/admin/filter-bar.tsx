"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { clsx } from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: FilterFieldConfig[];
  extra?: ReactNode;
  className?: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

// ─── Main FilterBar ───────────────────────────────────────────────────────────

export function FilterBar({
  searchPlaceholder = "Search…",
  searchKey = "q",
  filters = [],
  extra,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on any filter change
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const hasFilters =
    searchParams.get(searchKey) ||
    filters.some((f) => searchParams.get(f.key));

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4",
        isPending && "opacity-70 pointer-events-none",
        className
      )}
    >
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          defaultValue={searchParams.get(searchKey) ?? ""}
          onChange={(e) => updateParam(searchKey, e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Select filters */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={searchParams.get(f.key) ?? ""}
          onChange={(e) => updateParam(f.key, e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label={f.label}
        >
          <option value="">{f.placeholder ?? `All ${f.label}`}</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Extra slot (date pickers, etc.) */}
      {extra}

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Standalone search input (useful when embedded in page headers) ───────────

export interface SearchInputProps {
  paramKey?: string;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  paramKey = "q",
  placeholder = "Search…",
  className,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(paramKey, value); else params.delete(paramKey);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams, paramKey]
  );

  return (
    <div className={clsx("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={searchParams.get(paramKey) ?? ""}
        onChange={(e) => update(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationProps {
  page: number;
  totalPages: number;
  pageKey?: string;
}

export function Pagination({
  page,
  totalPages,
  pageKey = "page",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goTo = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (p <= 1) params.delete(pageKey); else params.set(pageKey, String(p));
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams, pageKey]
  );

  if (totalPages <= 1) return null;

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-2 pt-4 text-sm text-slate-600",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-sm",
                p === page
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}