"use client";

import { useRouter } from "next/navigation";
import type { TemplateListRecord } from "@/lib/data/inspections";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { ClipboardCheck } from "lucide-react";

interface TemplatesTableProps {
  templates: TemplateListRecord[];
  total: number;
  page: number;
  totalPages: number;
  categoryOptions: { id: string; name: string }[];
}

function triggerBadge(trigger: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    checkout: { variant: "blue", label: "Checkout" },
    checkin: { variant: "green", label: "Check-in" },
    both: { variant: "purple", label: "Both" },
    manual: { variant: "slate", label: "Manual" },
  };
  const cfg = map[trigger] ?? { variant: "slate", label: trigger };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function TemplatesTable({
  templates,
  total,
  page,
  totalPages,
  categoryOptions,
}: TemplatesTableProps) {
  const router = useRouter();

  const columns: Column<TemplateListRecord>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.categoryName ?? "All categories"}
        </span>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      cell: (row) => triggerBadge(row.triggerType),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          variant={row.status === "active" ? "green" : "slate"}
          label={row.status === "active" ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (row) => (
        <span className="text-sm font-medium text-slate-900">
          {row.itemCount}
        </span>
      ),
    },
    {
      key: "runs",
      header: "Runs",
      cell: (row) => (
        <span className="text-sm text-slate-600">{row.runCount}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search templates…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            key: "categoryId",
            label: "Category",
            options: categoryOptions.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          },
          {
            key: "triggerType",
            label: "Trigger",
            options: [
              { value: "checkout", label: "Checkout" },
              { value: "checkin", label: "Check-in" },
              { value: "both", label: "Both" },
              { value: "manual", label: "Manual" },
            ],
          },
        ]}
      />

      <div className="text-sm text-slate-500">
        {total} template{total !== 1 ? "s" : ""}
      </div>

      {templates.length > 0 ? (
        <DataTable
          columns={columns}
          rows={templates}
          getRowKey={(row) => row.id}
          onRowClick={(row) =>
            router.push(`/admin/inspections/${row.id}`)
          }
        />
      ) : (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="No inspection templates"
          description="Create your first inspection checklist template."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}