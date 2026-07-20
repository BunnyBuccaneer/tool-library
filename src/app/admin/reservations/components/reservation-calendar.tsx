"use client";

import { useRouter } from "next/navigation";
import type { CalendarEvent } from "@/lib/data/reservations";
import { reservationStatusBadge } from "@/components/admin/status-badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReservationCalendarProps {
  events: CalendarEvent[];
  currentMonth?: string;
}

export function ReservationCalendar({
  events,
  currentMonth,
}: ReservationCalendarProps) {
  const router = useRouter();

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (currentMonth) {
    const parts = currentMonth.split("-");
    if (parts.length === 2) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    }
  }

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthLabel = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Build day cells
  const cells: { day: number | null; events: CalendarEvent[] }[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: null, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter(
      (e) => e.pickupDate <= dateStr && e.returnDate >= dateStr
    );
    cells.push({ day: d, events: dayEvents });
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-200 text-yellow-800",
    confirmed: "bg-blue-200 text-blue-800",
    checked_out: "bg-purple-200 text-purple-800",
    overdue: "bg-red-200 text-red-800",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() =>
            router.push(
              `/admin/reservations?view=calendar&calMonth=${prevMonthStr}`
            )
          }
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900">{monthLabel}</h3>
        <button
          onClick={() =>
            router.push(
              `/admin/reservations?view=calendar&calMonth=${nextMonthStr}`
            )
          }
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-b-lg overflow-hidden">
        {cells.map((cell, idx) => {
          const today = new Date();
          const isToday =
            cell.day !== null &&
            year === today.getFullYear() &&
            month === today.getMonth() &&
            cell.day === today.getDate();

          return (
            <div
              key={idx}
              className={`min-h-[90px] bg-white p-1.5 ${
                cell.day === null ? "bg-slate-50" : ""
              }`}
            >
              {cell.day !== null && (
                <>
                  <div
                    className={`mb-1 text-xs font-medium ${
                      isToday
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {cell.events.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() =>
                          router.push(`/admin/reservations/${ev.id}`)
                        }
                        className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight ${
                          statusColors[ev.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                        title={`${ev.toolName} — ${ev.userName ?? "Unknown"}`}
                      >
                        {ev.toolName}
                      </button>
                    ))}
                    {cell.events.length > 3 && (
                      <p className="text-[10px] text-slate-400">
                        +{cell.events.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-300" /> Confirmed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-300" /> Checked
          Out
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" /> Overdue
        </span>
      </div>
    </div>
  );
}