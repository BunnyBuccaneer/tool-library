"use client";

import { useRouter } from "next/navigation";
import type {
  MaintenanceRecordListItem,
  ScheduleListItem,
} from "@/lib/data/maintenance";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import {
  maintenanceTypeBadge,
  StatusBadge,
} from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Wrench, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type MaintenanceTableProps =
  | {
      mode: "records";
      records: MaintenanceRecordListItem[];
      total: number;
      page: number;
      totalPages: number;
      schedules?: never;
    }
  | {
      mode: "schedules";
      schedules: ScheduleListItem[];
      total: number;
      page: number;
      totalPages: number;
      records?: never;
    };

export function MaintenanceTable(props: MaintenanceTableProps) {
  const router = useRouter();

  if (props.mode === "records") {
    const columns: Column<MaintenanceRecordListItem>[] = [
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
        key: "type",
        header: "Type",
        cell: (row) => maintenanceTypeBadge(row.maintenanceType),
      },
      {
        key: "description",
        header: "Description",
        cell: (row) => (
          <p className="text-sm text-slate-700 line-clamp-1">
            {row.description}
          </p>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        cell: (row) => (
          <span className="text-sm text-slate-700">
            {row.cost ? `$${parseFloat(row.cost).toFixed(2)}` : "—"}
          </span>
        ),
      },
      {
        key: "performedBy",
        header: "By",
        cell: (row) => (
          <span className="text-sm text-slate-600">
            {row.performedByName ?? "—"}
          </span>
        ),
      },
      {
        key: "date",
        header: "Performed",
        cell: (row) => (
          <span className="text-xs text-slate-500">
            {format(new Date(row.performedAt), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        key: "nextDue",
        header: "Next Due",
        cell: (row) =>
          row.nextDueAt ? (
            <span
              className={`text-xs ${
                new Date(row.nextDueAt) <= new Date()
                  ? "font-medium text-red-600"
                  : "text-slate-500"
              }`}
            >
              {format(new Date(row.nextDueAt), "MMM d, yyyy")}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
    ];

    return (
      <div className="space-y-4">
        <FilterBar
          searchPlaceholder="Search by tool name, asset ID, description…"
          searchKey="q"
          filters={[
            {
              key: "maintenanceType",
              label: "Type",
              options: [
                { value: "routine", label: "Routine" },
                { value: "repair", label: "Repair" },
                { value: "inspection", label: "Inspection" },
                { value: "calibration", label: "Calibration" },
                { value: "cleaning", label: "Cleaning" },
                { value: "replacement", label: "Replacement" },
                { value: "other", label: "Other" },
              ],
            },
          ]}
        />
        <div className="text-sm text-slate-500">
          {props.total} record{props.total !== 1 ? "s" : ""}
        </div>
        {props.records.length > 0 ? (
          <DataTable
            columns={columns}
            rows={props.records}
            getRowKey={(row) => row.id}
            onRowClick={(row) =>
              router.push(`/admin/maintenance/${row.id}`)
            }
          />
        ) : (
          <EmptyState
            icon={<Wrench className="h-7 w-7" />}
            title="No maintenance records"
            description="Record your first maintenance activity."
          />
        )}
        <Pagination page={props.page} totalPages={props.totalPages} />
      </div>
    );
  }

  // Schedules mode
  const scheduleColumns: Column<ScheduleListItem>[] = [
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
      key: "title",
      header: "Schedule",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => maintenanceTypeBadge(row.maintenanceType),
    },
    {
      key: "interval",
      header: "Interval",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          Every {row.intervalDays} day{row.intervalDays !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        if (row.isOverdue) {
          return (
            <div className="flex items-center gap-1">
              <StatusBadge variant="red" label="Overdue" />
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
          );
        }
        const map: Record<string, any> = {
          active: { variant: "green", label: "Active" },
          paused: { variant: "yellow", label: "Paused" },
          completed: { variant: "slate", label: "Completed" },
        };
        const cfg = map[row.status] ?? { variant: "slate", label: row.status };
        return <StatusBadge variant={cfg.variant} label={cfg.label} />;
      },
    },
    {
      key: "nextDue",
      header: "Next Due",
      cell: (row) => (
        <div>
          <p
            className={`text-sm ${
              row.isOverdue ? "font-medium text-red-600" : "text-slate-600"
            }`}
          >
            {format(new Date(row.nextDueAt), "MMM d, yyyy")}
          </p>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(row.nextDueAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      ),
    },
    {
      key: "lastPerformed",
      header: "Last Done",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.lastPerformedAt
            ? format(new Date(row.lastPerformedAt), "MMM d, yyyy")
            : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search schedules…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "completed", label: "Completed" },
            ],
          },
          {
            key: "maintenanceType",
            label: "Type",
            options: [
              { value: "routine", label: "Routine" },
              { value: "repair", label: "Repair" },
              { value: "inspection", label: "Inspection" },
              { value: "calibration", label: "Calibration" },
              { value: "cleaning", label: "Cleaning" },
              { value: "replacement", label: "Replacement" },
              { value: "other", label: "Other" },
            ],
          },
          {
            key: "overdue",
            label: "Overdue",
            options: [{ value: "true", label: "Overdue Only" }],
          },
        ]}
      />
      <div className="text-sm text-slate-500">
        {props.total} schedule{props.total !== 1 ? "s" : ""}
      </div>
      {props.schedules.length > 0 ? (
        <DataTable
          columns={scheduleColumns}
          rows={props.schedules}
          getRowKey={(row) => row.id}
        />
      ) : (
        <EmptyState
          icon={<Wrench className="h-7 w-7" />}
          title="No maintenance schedules"
          description="Create a recurring schedule to keep your tools in shape."
        />
      )}
      <Pagination page={props.page} totalPages={props.totalPages} />
    </div>
  );
}