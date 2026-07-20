"use client";

import { useRouter } from "next/navigation";
import type { CertTypeListRecord } from "@/lib/data/certifications";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Award } from "lucide-react";

interface CertTypesTableProps {
  certTypes: CertTypeListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function CertTypesTable({
  certTypes,
  total,
  page,
  totalPages,
}: CertTypesTableProps) {
  const router = useRouter();

  const columns: Column<CertTypeListRecord>[] = [
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
      key: "required",
      header: "Required",
      cell: (row) =>
        row.isRequired ? (
          <StatusBadge variant="red" label="Required" dot={false} />
        ) : (
          <span className="text-sm text-slate-400">Optional</span>
        ),
    },
    {
      key: "validity",
      header: "Validity",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.validityMonths
            ? `${row.validityMonths} month${row.validityMonths !== 1 ? "s" : ""}`
            : "Lifetime"}
        </span>
      ),
    },
    {
      key: "requirements",
      header: "Requirements",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.requirementCount} tool/category
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      cell: (row) => (
        <span className="text-sm font-medium text-slate-900">
          {row.memberCertCount}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search certification types…"
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
        ]}
      />

      <div className="text-sm text-slate-500">
        {total} certification type{total !== 1 ? "s" : ""}
      </div>

      {certTypes.length > 0 ? (
        <DataTable
          columns={columns}
          rows={certTypes}
          getRowKey={(row) => row.id}
          onRowClick={(row) =>
            router.push(`/admin/certifications/${row.id}`)
          }
        />
      ) : (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="No certification types"
          description="Create your first certification type to get started."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}