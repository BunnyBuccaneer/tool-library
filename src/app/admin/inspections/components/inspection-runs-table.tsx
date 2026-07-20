"use client";

import { useRouter } from "next/navigation";
import type { RunListRecord } from "@/lib/data/inspections";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { RunInspectionForm } from "./run-inspection-form";

interface InspectionRunsTableProps {
  runs: RunListRecord[];
  total: number;
  page: number;
  totalPages: number;
  templateDropdown: { id: string; name: string }[];
}

function runStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    in_progress: { variant: "yellow", label: "In Progress" },
    passed: { variant: "green", label: "Passed" },
    failed: { variant: "red", label: "Failed" },
    flagged: { variant: "orange", label: "Flagged" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function InspectionRunsTable({
  runs,
  total,
  page,
  totalPages,
  templateDropdown,
}: InspectionRunsTableProps) {
  const router = useRouter();

  const columns: Column<RunListRecord>[] = [
    {
      key: "tool",
      header: "Tool",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.toolName}</p>
          {row.toolAssetId && (
            <p className="font-mono text-xs text-slate-400">
              {row.toolAssetId}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "template",
      header: "Template",
      cell: (row) => (
        <span className="text-sm text-slate-700">{row.templateName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {runStatusBadge(row.status)}
          {row.flaggedForRepair && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </div>
      ),
    },
    {
      key: "results",
      header: "Results",
      cell: (row) =>
        row.totalItems > 0 ? (
          <div className="text-sm">
            <span className="text-green-600">{row.passCount}✓</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="text-red-600">{row.failCount}✗</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="text-slate-400">{row.totalItems} total</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "trigger",
      header: "Trigger",
      cell: (row) => (
        <span className="text-xs font-medium capitalize text-slate-500">
          {row.triggerType}
        </span>
      ),
    },
    {
      key: "performer",
      header: "By",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.performedByName ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {format(new Date(row.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          searchPlaceholder="Search by tool, template, or performer…"
          searchKey="q"
          filters={[
            {
              key: "runStatus",
              label: "Status",
              options: [
                { value: "in_progress", label: "In Progress" },
                { value: "passed", label: "Passed" },
                { value: "failed", label: "Failed" },
                { value: "flagged", label: "Flagged" },
              ],
            },
            {
              key: "templateId",
              label: "Template",
              options: templateDropdown.map((t) => ({
                value: t.id,
                label: t.name,
              })),
            },
            {
              key: "flagged",
              label: "Flagged",
              options: [{ value: "true", label: "Flagged for Repair" }],
            },
          ]}
          className="flex-1"
        />
        <RunInspectionForm />
      </div>

      <div className="text-sm text-slate-500">
        {total} inspection run{total !== 1 ? "s" : ""}
      </div>

      {runs.length > 0 ? (
        <DataTable
          columns={columns}
          rows={runs}
          getRowKey={(row) => row.id}
          onRowClick={(row) =>
            router.push(`/admin/inspections/${row.id}`)
          }
        />
      ) : (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="No inspection runs"
          description="Start a new inspection to track tool condition."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}