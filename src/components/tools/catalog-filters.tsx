"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { formatStatus, formatSkillLevel } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/constants";
import type { CatalogFilters as CatalogFiltersType } from "@/lib/types";

interface CatalogFiltersProps {
  filters: CatalogFiltersType;
}

export function CatalogFilters({ filters }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/tools?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Location filter - uses your multi-location system */}
      <Select
        label="Location"
        value={searchParams.get("location") || "all"}
        onChange={(e) => updateParam("location", e.target.value)}
        allLabel="All Locations"
        options={filters.locations.map((l) => ({
          value: l.id,
          label: l.name,
          count: l.count,
        }))}
      />

      <Select
        label="Category"
        value={searchParams.get("category") || "all"}
        onChange={(e) => updateParam("category", e.target.value)}
        allLabel="All Categories"
        options={filters.categories.map((c) => ({
          value: c.slug,
          label: c.name,
          count: c.count,
        }))}
      />

      <Select
        label="Availability"
        value={searchParams.get("status") || "all"}
        onChange={(e) => updateParam("status", e.target.value)}
        allLabel="All Statuses"
        options={filters.statuses.map((s) => ({
          value: s.value,
          label: formatStatus(s.value),
          count: s.count,
        }))}
      />

      <Select
        label="Skill Level"
        value={searchParams.get("skillLevel") || "all"}
        onChange={(e) => updateParam("skillLevel", e.target.value)}
        allLabel="All Levels"
        options={filters.skillLevels.map((s) => ({
          value: s.value,
          label: formatSkillLevel(s.value),
          count: s.count,
        }))}
      />

      <Select
        label="Brand"
        value={searchParams.get("brand") || "all"}
        onChange={(e) => updateParam("brand", e.target.value)}
        allLabel="All Brands"
        options={filters.brands.map((b) => ({
          value: b.name,
          label: b.name,
          count: b.count,
        }))}
      />

      <Select
        label="Sort By"
        value={searchParams.get("sort") || "name_asc"}
        onChange={(e) => updateParam("sort", e.target.value)}
        allLabel="Default"
        options={SORT_OPTIONS.map((s) => ({
          value: s.value,
          label: s.label,
        }))}
      />
    </div>
  );
}
