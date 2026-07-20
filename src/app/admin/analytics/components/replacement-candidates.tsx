import type { ReplacementCandidate } from "@/lib/data/analytics";
import { AnalyticsCard } from "./analytics-card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { toolStatusBadge, StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ReplacementCandidatesProps {
  candidates: ReplacementCandidate[];
}

export function ReplacementCandidatesView({ candidates }: ReplacementCandidatesProps) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns: Column<ReplacementCandidate>[] = [
    {
      key: "tool",
      header: "Tool",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <div className="flex gap-2 text-xs text-slate-400">
            {row.assetId && <span>{row.assetId}</span>}
            {row.categoryName && <span>{row.categoryName}</span>}
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (row) => toolStatusBadge(row.status) },
    {
      key: "costRatio",
      header: "Cost Ratio",
      cell: (row) => (
        <StatusBadge
          dot={false}
          variant={row.costRatio >= 0.75 ? "red" : row.costRatio >= 0.5 ? "orange" : "yellow"}
          label={`${(row.costRatio * 100).toFixed(0)}%`}
        />
      ),
    },
    {
      key: "replacement",
      header: "Replacement",
      cell: (row) => <span className="text-sm text-slate-700">${fmt(row.replacementCost)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "totalCost",
      header: "Total Spent",
      cell: (row) => <span className="text-sm font-medium text-red-600">${fmt(row.totalCost)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "repairs",
      header: "Repairs",
      cell: (row) => <span className="text-sm text-slate-600">{row.repairCount}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "lastRepair",
      header: "Last Repair",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.lastRepairDate ? format(new Date(row.lastRepairDate), "MMM d, yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <div className="flex items-start gap-1">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
          <span className="text-xs text-slate-600">{row.reason}</span>
        </div>
      ),
    },
  ];

  return (
    <AnalyticsCard
      title={`Replacement Candidates (${candidates.length})`}
      subtitle="Tools where maintenance/repair costs approach or exceed replacement value"
    >
      {candidates.length > 0 ? (
        <DataTable columns={columns} rows={candidates} getRowKey={(r) => r.id} />
      ) : (
        <EmptyState
          icon={<AlertTriangle className="h-7 w-7" />}
          title="No replacement candidates"
          description="No tools currently meet the replacement threshold criteria (≥50% cost ratio, 3+ repairs, or in maintenance)."
        />
      )}
    </AnalyticsCard>
  );
}