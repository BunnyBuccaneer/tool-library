"use client";

import { useRouter } from "next/navigation";
import type { IssueListRecord } from "@/lib/data/issues";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { AlertCircle, Link as LinkIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface IssuesTableProps {
  issues: IssueListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function issueStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    new: { variant: "red", label: "New" },
    triaged: { variant: "yellow", label: "Triaged" },
    assigned: { variant: "blue", label: "Assigned" },
    in_progress: { variant: "purple", label: "In Progress" },
    resolved: { variant: "green", label: "Resolved" },
    closed: { variant: "slate", label: "Closed" },
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

function categoryBadge(category: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    damage: { variant: "red", label: "Damage" },
    malfunction: { variant: "orange", label: "Malfunction" },
    missing_part: { variant: "yellow", label: "Missing Part" },
    safety: { variant: "red", label: "Safety" },
    cosmetic: { variant: "blue", label: "Cosmetic" },
    other: { variant: "slate", label: "Other" },
  };
  const cfg = map[category] ?? { variant: "slate", label: category };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function IssuesTable({ issues: rows, total, page, totalPages }: IssuesTableProps) {
  const router = useRouter();

  const columns: Column<IssueListRecord>[] = [
    {
      key: "title",
      header: "Issue",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          {row.toolName && <p className="text-xs text-slate-500">{row.toolName}</p>}
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (row) => issueStatusBadge(row.status) },
    { key: "priority", header: "Priority", cell: (row) => priorityBadge(row.priority) },
    { key: "category", header: "Category", cell: (row) => categoryBadge(row.category) },
    {
      key: "assignee",
      header: "Assigned To",
      cell: (row) => <span className="text-sm text-slate-600">{row.assignedToName ?? "Unassigned"}</span>,
    },
    {
      key: "links",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-400">
          {row.repairId && <LinkIcon className="h-3.5 w-3.5 text-teal-500" />}
          {row.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> {row.commentCount}
            </span>
          )}
        </div>
      ),
      className: "w-20",
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => <span className="text-xs text-slate-500">{format(new Date(row.createdAt), "MMM d, yyyy")}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search issues by title, tool, asset ID…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "new", label: "New" },
              { value: "triaged", label: "Triaged" },
              { value: "assigned", label: "Assigned" },
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
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
          {
            key: "category",
            label: "Category",
            options: [
              { value: "damage", label: "Damage" },
              { value: "malfunction", label: "Malfunction" },
              { value: "missing_part", label: "Missing Part" },
              { value: "safety", label: "Safety" },
              { value: "cosmetic", label: "Cosmetic" },
              { value: "other", label: "Other" },
            ],
          },
        ]}
      />

      <div className="text-sm text-slate-500">{total} issue{total !== 1 ? "s" : ""}</div>

      {rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} onRowClick={(r) => router.push(`/admin/issues/${r.id}`)} />
      ) : (
        <EmptyState icon={<AlertCircle className="h-7 w-7" />} title="No issues found" description="Create an issue to start tracking." />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}