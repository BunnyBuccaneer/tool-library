"use client";

import type { NotificationListRecord } from "@/lib/data/admin-notifications";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { deleteNotification } from "@/lib/actions/admin-notifications";
import { Bell, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface NotificationsTableProps {
  notifications: NotificationListRecord[];
  total: number;
  page: number;
  totalPages: number;
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

export function NotificationsTable({ notifications: rows, total, page, totalPages }: NotificationsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<NotificationListRecord | null>(null);

  const columns: Column<NotificationListRecord>[] = [
    {
      key: "recipient",
      header: "Recipient",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.userName ?? "No name"}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (row) => notifTypeBadge(row.type) },
    {
      key: "title",
      header: "Title",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{row.message}</p>
        </div>
      ),
    },
    {
      key: "read",
      header: "Read",
      cell: (row) => (
        <StatusBadge
          variant={row.isRead ? "green" : "yellow"}
          label={row.isRead ? "Read" : "Unread"}
        />
      ),
    },
    {
      key: "created",
      header: "Sent",
      cell: (row) => <span className="text-xs text-slate-500">{format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search by recipient, title, message…"
        searchKey="q"
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "reservation_reminder", label: "Reservation" },
              { value: "pickup_reminder", label: "Pickup" },
              { value: "return_reminder", label: "Return" },
              { value: "overdue", label: "Overdue" },
              { value: "membership_expiring", label: "Expiring" },
              { value: "general", label: "General" },
            ],
          },
          {
            key: "isRead",
            label: "Status",
            options: [
              { value: "false", label: "Unread" },
              { value: "true", label: "Read" },
            ],
          },
        ]}
      />

      <div className="text-sm text-slate-500">{total} notification{total !== 1 ? "s" : ""}</div>

      {rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
      ) : (
        <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications" description="No notifications match the current filters." />
      )}

      <Pagination page={page} totalPages={totalPages} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) await deleteNotification(deleteTarget.id); }}
        title="Delete Notification"
        description={`Delete this notification for ${deleteTarget?.userName ?? deleteTarget?.userEmail}?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}