"use client";

import { useRouter } from "next/navigation";
import type { RepairListRecord } from "@/lib/data/repairs";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Wrench } from "lucide-react";
import { format } from "date-fns";

interface RepairsTableProps {
  repairs: RepairListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function repairStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    reported: { variant: "red", label: "Reported" },
    diagnosing: { variant: "yellow", label: "Diagnosing" },
    in_repair: { variant: "blue", label: "In Repair" },
    waiting_parts: { variant: "orange", label: "Waiting Parts" },
    completed: { variant: "green", label: "Completed" },
    unrepairable: { variant: "slate", label: "Unrepairable" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

function priorityBadge(priority: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    low: { variant: "slate", label: "Low" },
    medium: { variant: "blue", label: "Medium" },
    high: { variant: "orange", label: "High" },
    critical: { variant: "red", label: "Critical" },
  };
  const cfg = map[priority] ?? { variant: "slate", label: priority };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function RepairsTable({
  repairs: rows,
  total,
  page,
  totalPages,
}: RepairsTableProps) {
  const router = useRouter();

  const columns: Column<RepairListRecord>[] = [
    {
      key: "title",
      header: "Repair",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">{row.toolName}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => repairStatusBadge(row.status),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => priorityBadge(row.priority),
    },
    {
      key: "assignee",
      header: "Assigned To",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.assignedToName ?? row.vendorName ?? "Unassigned"}
        </span>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      cell: (row) => (
        <div className="text-sm">
          {row.actualCost ? (
            <span className="font-medium text-slate-900">
              ${parseFloat(row.actualCost).toFixed(2)}
            </span>
          ) : row.estimatedCost ? (
            <span className="text-slate-500">
              ~${parseFloat(row.estimatedCost).toFixed(2)}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "parts",
      header: "Parts",
      cell: (row) => (
        <span className="text-sm text-slate-600">{row.partCount}</span>
      ),
    },
    {
      key: "created",
      header: "Reported",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {format(new Date(row.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search repairs by title, tool, vendor…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "reported", label: "Reported" },
              { value: "diagnosing", label: "Diagnosing" },
              { value: "in_repair", label: "In Repair" },
              { value: "waiting_parts", label: "Waiting Parts" },
              { value: "completed", label: "Completed" },
              { value: "unrepairable", label: "Unrepairable" },
            ],
          },
          {
            key: "priority",
            label: "Priority",
            options: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ],
          },
        ]}
      />

      <div className="text-sm text-slate-500">
        {total} repair{total !== 1 ? "s" : ""}
      </div>

      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/admin/repairs/${row.id}`)}
        />
      ) : (
        <EmptyState
          icon={<Wrench className="h-7 w-7" />}
          title="No repairs found"
          description="Report a repair to start tracking."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}