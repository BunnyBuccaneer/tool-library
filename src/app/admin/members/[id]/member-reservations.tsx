"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { reservationStatusBadge } from "@/components/admin/status-badge";
import { format, isValid, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import type { MemberReservationRecord } from "@/lib/data/members";

/**
 * Safely format a date value that might be:
 * - null / undefined
 * - a Date object
 * - a full ISO string ("2024-01-15T10:30:00.000Z")
 * - a plain date string ("2024-01-15")
 */
function safeFormatDate(
  input: string | Date | null | undefined,
  fmt: string = "MMM d, yyyy",
  fallback: string = "—"
): string {
  if (!input) return fallback;

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      date = new Date(`${input}T00:00:00`);
    } else {
      date = parseISO(input);
      if (!isValid(date)) date = new Date(input);
    }
  } else {
    return fallback;
  }

  return isValid(date) ? format(date, fmt) : fallback;
}

export function MemberReservations({
  reservations,
}: {
  reservations: MemberReservationRecord[];
}) {
  const reservationColumns: Column<MemberReservationRecord>[] = [
    {
      key: "tool",
      header: "Tool",
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.toolName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => reservationStatusBadge(row.status),
    },
    {
      key: "pickup",
      header: "Pickup",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {safeFormatDate(row.pickupDate)}
        </span>
      ),
    },
    {
      key: "return",
      header: "Return",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {safeFormatDate(row.returnDate)}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {safeFormatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-7 w-7" />}
        title="No reservations"
        description="This member hasn't made any reservations yet."
      />
    );
  }

  return (
    <DataTable
      columns={reservationColumns}
      rows={reservations}
      getRowKey={(row) => row.id}
    />
  );
}