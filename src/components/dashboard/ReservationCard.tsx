"use client";

import type { Reservation, Tool, Location } from "@/db/schema";

interface ReservationCardProps {
  reservation: Reservation;
  tool: Tool;
  location: Location | null;
  actions?: React.ReactNode;
}

export default function ReservationCard({
  reservation,
  tool,
  location,
  actions,
}: ReservationCardProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_out: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
    cancelled: "bg-slate-100 text-slate-500",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {tool.name}
            </h3>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                statusColors[reservation.status] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {reservation.status.replace("_", " ")}
            </span>
          </div>
          {tool.brand && (
            <p className="mt-0.5 text-sm text-slate-500">
              {tool.brand} {tool.model ?? ""}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>
              📅 Pickup: {reservation.pickupDate}
              {reservation.pickupTime ? ` at ${reservation.pickupTime}` : ""}
            </span>
            <span>
              📅 Return: {reservation.returnDate}
              {reservation.returnTime ? ` at ${reservation.returnTime}` : ""}
            </span>
            {location && (
              <span>📍 {location.name}</span>
            )}
          </div>
          {reservation.notes && (
            <p className="mt-1 text-xs text-slate-400">{reservation.notes}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  );
}
