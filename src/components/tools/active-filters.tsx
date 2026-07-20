"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { formatStatus, formatSkillLevel } from "@/lib/utils";
import type { CatalogFilters } from "@/lib/types";

interface ActiveFiltersProps {
  filters: CatalogFilters;
}

export function ActiveFilters({ filters }: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilters: { key: string; label: string; value: string }[] = [];

  const search = searchParams.get("search");
  if (search) {
    activeFilters.push({ key: "search", label: "Search", value: search });
  }

  // Location filter - lookup name from your locations data
  const locationId = searchParams.get("location");
  if (locationId && locationId !== "all") {
    const locationName =
      filters.locations.find((l) => l.id === locationId)?.name || locationId;
    activeFilters.push({
      key: "location",
      label: "Location",
      value: locationName,
    });
  }

  const category = searchParams.get("category");
  if (category && category !== "all") {
    const categoryName =
      filters.categories.find((c) => c.slug === category)?.name || category;
    activeFilters.push({
      key: "category",
      label: "Category",
      value: categoryName,
    });
  }

  const status = searchParams.get("status");
  if (status && status !== "all") {
    activeFilters.push({
      key: "status",
      label: "Status",
      value: formatStatus(status),
    });
  }

  const skillLevel = searchParams.get("skillLevel");
  if (skillLevel && skillLevel !== "all") {
    activeFilters.push({
      key: "skillLevel",
      label: "Skill",
      value: formatSkillLevel(skillLevel),
    });
  }

  const brand = searchParams.get("brand");
  if (brand && brand !== "all") {
    activeFilters.push({ key: "brand", label: "Brand", value: brand });
  }

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`/tools?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const view = searchParams.get("view");
    if (view) params.set("view", view);
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/tools?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Active:
      </span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => removeFilter(filter.key)}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <span className="text-blue-400">{filter.label}:</span> {filter.value}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs font-medium text-slate-400 hover:text-slate-600 underline transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
