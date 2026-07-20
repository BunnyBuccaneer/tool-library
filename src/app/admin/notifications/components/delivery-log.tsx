"use client";

import type { BatchListRecord } from "@/lib/data/admin-notifications";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface DeliveryLogProps {
  batches: BatchListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function batchStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    draft: { variant: "slate", label: "Draft" },
    sending: { variant: "yellow", label: "Sending" },
    sent: { variant: "green", label: "Sent" },
    failed: { variant: "red", label: "Failed" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

function notifTypeBadge(type: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    reservation_reminder: { variant: "blue", label: "Reservation" },
    pickup_reminder: { variant: "purple", label: "Pickup" },
    return_reminder: { variant: "orange", label: "Return" },
    overdue: { variant: "red", label: "Overdue" },
    membership_expiring: { variant: "yellow", label: "Expiring" },
    general: { variant: "slate", label: "General" },
  };
  const cfg = map[type] ?? { variant: "slate", label: type };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function DeliveryLog({ batches, total, page, totalPages }: DeliveryLogProps) {
  const router = useRouter();

  const columns: Column<BatchListRecord>[] = [
    {
      key: "subject",
      header: "Subject",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.subject}</p>
          {row.templateName && <p className="text-xs text-slate-400">Template: {row.templateName}</p>}
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (row) => notifTypeBadge(row.type) },
    { key: "status", header: "Status", cell: (row) => batchStatusBadge(row.status) },
    {
      key: "segment",
      header: "Segment",
      cell: (row) => <span className="text-sm text-slate-600">{row.segment?.replace(/_/g, " ") ?? "—"}</span>,
    },
    {
      key: "recipients",
      header: "Recipients",
      cell: (row) => <span className="text-sm font-medium text-slate-900">{row.recipientCount}</span>,
    },
    {
      key: "sentBy",
      header: "Sent By",
      cell: (row) => <span className="text-sm text-slate-600">{row.sentByName ?? "Unknown"}</span>,
    },
    {
      key: "sentAt",
      header: "Sent At",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.sentAt ? format(new Date(row.sentAt), "MMM d, yyyy h:mm a") : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search by subject…"
        searchKey="q"
        filters={[
          { key: "status", label: "Status", options: [{ value: "draft", label: "Draft" }, { value: "sending", label: "Sending" }, { value: "sent", label: "Sent" }, { value: "failed", label: "Failed" }] },
          {
            key: "type", label: "Type",
            options: [
              { value: "general", label: "General" }, { value: "reservation_reminder", label: "Reservation" },
              { value: "pickup_reminder", label: "Pickup" }, { value: "return_reminder", label: "Return" },
              { value: "overdue", label: "Overdue" }, { value: "membership_expiring", label: "Expiring" },
            ],
          },
        ]}
      />

      <div className="text-sm text-slate-500">{total} batch{total !== 1 ? "es" : ""}</div>

      {batches.length > 0 ? (
        <DataTable
          columns={columns}
          rows={batches}
          getRowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/admin/notifications/${r.id}`)}
        />
      ) : (
        <EmptyState icon={<Send className="h-7 w-7" />} title="No delivery batches" description="Send a notification to see delivery history." />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}