"use client";

import type { ToolFinancialRecord, CategoryFinancialRecord } from "@/lib/data/finance";
import { DataTable, type Column } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { toolStatusBadge } from "@/components/admin/status-badge";
import { DollarSign } from "lucide-react";

type ToolProfitabilityProps =
  | { mode: "tools"; tools: ToolFinancialRecord[]; categories?: never }
  | { mode: "categories"; categories: CategoryFinancialRecord[]; tools?: never };

export function ToolProfitability(props: ToolProfitabilityProps) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (props.mode === "tools") {
    const columns: Column<ToolFinancialRecord>[] = [
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
        key: "replacement",
        header: "Replacement",
        cell: (row) => <span className="text-sm text-slate-700">${fmt(row.replacementCost)}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "maintenance",
        header: "Maintenance",
        cell: (row) => <span className="text-sm text-orange-600">${fmt(row.maintenanceCost)}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "repair",
        header: "Repairs",
        cell: (row) => <span className="text-sm text-red-600">${fmt(row.repairCost)}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "parts",
        header: "Parts",
        cell: (row) => <span className="text-sm text-purple-600">${fmt(row.partsCost)}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "totalCost",
        header: "Total Cost",
        cell: (row) => <span className="text-sm font-semibold text-slate-900">${fmt(row.totalCost)}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "net",
        header: "Net",
        cell: (row) => (
          <span className={`text-sm font-semibold ${row.netPosition >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${fmt(row.netPosition)}
          </span>
        ),
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "reservations",
        header: "Res.",
        cell: (row) => <span className="text-sm text-slate-600">{row.reservationCount}</span>,
        headerClassName: "text-right",
        className: "text-right",
      },
      {
        key: "costPer",
        header: "$/Res",
        cell: (row) => (
          <span className="text-sm text-slate-500">
            {row.reservationCount > 0 ? `$${fmt(row.costPerReservation)}` : "—"}
          </span>
        ),
        headerClassName: "text-right",
        className: "text-right",
      },
    ];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Tool Profitability ({props.tools.length} tools)
        </h3>
        {props.tools.length > 0 ? (
          <DataTable columns={columns} rows={props.tools} getRowKey={(r) => r.id} />
        ) : (
          <EmptyState icon={<DollarSign className="h-7 w-7" />} title="No financial data" description="Add tools with replacement costs to see profitability." />
        )}
      </div>
    );
  }

  // Categories mode
  const categoryColumns: Column<CategoryFinancialRecord>[] = [
    {
      key: "category",
      header: "Category",
      cell: (row) => <p className="font-medium text-slate-900">{row.categoryName}</p>,
    },
    {
      key: "tools",
      header: "Tools",
      cell: (row) => <span className="text-sm text-slate-600">{row.toolCount}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "replacement",
      header: "Replacement Value",
      cell: (row) => <span className="text-sm text-slate-700">${fmt(row.replacementValue)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "maintenance",
      header: "Maintenance",
      cell: (row) => <span className="text-sm text-orange-600">${fmt(row.maintenanceCost)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "repair",
      header: "Repairs",
      cell: (row) => <span className="text-sm text-red-600">${fmt(row.repairCost)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
    {
      key: "totalCost",
      header: "Total Cost",
      cell: (row) => <span className="text-sm font-semibold text-slate-900">${fmt(row.totalCost)}</span>,
      headerClassName: "text-right",
      className: "text-right",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Cost by Category ({props.categories.length} categories)
      </h3>
      {props.categories.length > 0 ? (
        <DataTable columns={categoryColumns} rows={props.categories} getRowKey={(r) => r.categoryName} />
      ) : (
        <EmptyState icon={<DollarSign className="h-7 w-7" />} title="No category data" description="Categorize tools to see breakdown." />
      )}
    </div>
  );
}