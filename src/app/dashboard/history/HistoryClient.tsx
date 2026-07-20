"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReservationCard from "@/components/dashboard/ReservationCard";
import type { Reservation, Tool, Location } from "@/db/schema";

interface Props {
  history: {
    reservation: Reservation;
    tool: Tool;
    location: Location | null;
  }[];
  initialFrom: string;
  initialTo: string;
}

export default function HistoryClient({
  history,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/dashboard/history?${params.toString()}`);
  };

  const clearFilter = () => {
    setFrom("");
    setTo("");
    router.push("/dashboard/history");
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={applyFilter}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Filter
        </button>
        {(from || to) && (
          <button
            onClick={clearFilter}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No rental history found.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(({ reservation, tool, location }) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              tool={tool}
              location={location}
            />
          ))}
        </div>
      )}
    </>
  );
}
