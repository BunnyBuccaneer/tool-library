import { Suspense } from "react";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { getCatalogData } from "@/lib/data/tools";
import { SearchInput } from "@/components/ui/search-input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { CatalogFilters } from "@/components/tools/catalog-filters";
import { ActiveFilters } from "@/components/tools/active-filters";
import { ToolGrid } from "@/components/tools/tool-grid";
import type { CatalogSearchParams } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Tools | Tool Library",
  description: "Browse and reserve tools from our community tool library.",
};

interface PageProps {
  searchParams: Promise<CatalogSearchParams>;
}

function buildPageUrl(baseParams: CatalogSearchParams, page: number): string {
  const params = new URLSearchParams();
  if (baseParams.search) params.set("search", baseParams.search);
  if (baseParams.location && baseParams.location !== "all")
    params.set("location", baseParams.location);
  if (baseParams.category && baseParams.category !== "all")
    params.set("category", baseParams.category);
  if (baseParams.status && baseParams.status !== "all")
    params.set("status", baseParams.status);
  if (baseParams.skillLevel && baseParams.skillLevel !== "all")
    params.set("skillLevel", baseParams.skillLevel);
  if (baseParams.brand && baseParams.brand !== "all")
    params.set("brand", baseParams.brand);
  if (baseParams.sort) params.set("sort", baseParams.sort);
  if (baseParams.view) params.set("view", baseParams.view);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/tools${qs ? `?${qs}` : ""}`;
}

// Load current user's favorites into a Set for O(1) lookups
async function getFavoriteSet(): Promise<Set<string>> {
  try {
    const userId = await getDemoUserId();
    const rows = await db
      .select({ toolId: favorites.toolId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return new Set(rows.map((r) => r.toolId));
  } catch {
    return new Set();
  }
}

export default async function ToolsCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Fetch catalog + favorites in parallel
  const [data, favoriteSet] = await Promise.all([
    getCatalogData(params),
    getFavoriteSet(),
  ]);

  const view = (params.view === "list" ? "list" : "grid") as "grid" | "list";

  // Enrich each tool with `isFavorited` flag
  const toolsWithFavorites = data.tools.map((tool) => ({
    ...tool,
    isFavorited: favoriteSet.has(tool.id),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tool Catalog</h1>
          <p className="mt-1 text-slate-500">
            Browse our collection and reserve the tools you need.
          </p>
        </div>

        {/* Search and view toggle row */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={null}>
            <SearchInput className="w-full sm:max-w-md" />
          </Suspense>
          <Suspense fallback={null}>
            <ViewToggle />
          </Suspense>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <Suspense fallback={null}>
            <CatalogFilters filters={data.filters} />
          </Suspense>
        </div>

        {/* Active filter chips */}
        <div className="mb-6">
          <Suspense fallback={null}>
            <ActiveFilters filters={data.filters} />
          </Suspense>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            {data.pagination.totalItems}{" "}
            {data.pagination.totalItems === 1 ? "tool" : "tools"} found
          </p>
        </div>

        {/* Tool grid/list */}
        {toolsWithFavorites.length > 0 ? (
          <>
            <ToolGrid tools={toolsWithFavorites} view={view} />
            <div className="mt-8">
              <Pagination
                pagination={data.pagination}
                buildUrl={(page) => buildPageUrl(params, page)}
              />
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}