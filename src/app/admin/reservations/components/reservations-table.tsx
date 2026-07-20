"use client";

import { useRouter } from "next/navigation";
import type { ReservationListRecord } from "@/lib/data/reservations";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { reservationStatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface ReservationsTableProps {
  reservations: ReservationListRecord[];
  total: number;
  page: number;
  totalPages: number;
  filterLocations: { id: string; name: string }[];
}

export function ReservationsTable({
  reservations: rows,
  total,
  page,
  totalPages,
  filterLocations,
}: ReservationsTableProps) {
  const router = useRouter();

  const columns: Column<ReservationListRecord>[] = [
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
      key: "member",
      header: "Member",
      cell: (row) => (
        <div>
          <p className="text-sm text-slate-900">
            {row.userName ?? "No name"}
          </p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
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
        <div className="text-sm text-slate-600">
          <p>
            {format(new Date(row.pickupDate + "T00:00:00"), "MMM d, yyyy")}
          </p>
          {row.pickupTime && (
            <p className="text-xs text-slate-400">{row.pickupTime}</p>
          )}
        </div>
      ),
    },
    {
      key: "return",
      header: "Return",
      cell: (row) => (
        <div className="text-sm text-slate-600">
          <p>
            {format(new Date(row.returnDate + "T00:00:00"), "MMM d, yyyy")}
          </p>
          {row.returnTime && (
            <p className="text-xs text-slate-400">{row.returnTime}</p>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.locationName ?? "—"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
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
        searchPlaceholder="Search by tool, member name, email, asset ID…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "checked_out", label: "Checked Out" },
              { value: "returned", label: "Returned" },
              { value: "cancelled", label: "Cancelled" },
              { value: "overdue", label: "Overdue" },
            ],
          },
          {
            key: "locationId",
            label: "Location",
            options: filterLocations.map((l) => ({
              value: l.id,
              label: l.name,
            })),
          },
        ]}
        extra={<DateFilters />}
      />

      <div className="text-sm text-slate-500">
        {total} reservation{total !== 1 ? "s" : ""}
      </div>

      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) =>
            router.push(`/admin/reservations/${row.id}`)
          }
        />
      ) : (
        <EmptyState
          icon={<Calendar className="h-7 w-7" />}
          title="No reservations found"
          description="Try adjusting your filters."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}

function DateFilters() {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500">From</label>
      <input
        type="date"
        name="dateFrom"
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          if (e.target.value) params.set("dateFrom", e.target.value);
          else params.delete("dateFrom");
          params.delete("page");
          window.location.href = `${window.location.pathname}?${params.toString()}`;
        }}
        defaultValue={
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("dateFrom") ?? ""
            : ""
        }
        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <label className="text-xs text-slate-500">To</label>
      <input
        type="date"
        name="dateTo"
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          if (e.target.value) params.set("dateTo", e.target.value);
          else params.delete("dateTo");
          params.delete("page");
          window.location.href = `${window.location.pathname}?${params.toString()}`;
        }}
        defaultValue={
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("dateTo") ?? ""
            : ""
        }
        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}