"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Search } from "lucide-react";

interface ConflictCheckerProps {
  toolId: string;
  toolName: string;
  reservationId: string;
}

interface ConflictData {
  hasConflict: boolean;
  conflicts: {
    id: string;
    userName: string | null;
    userEmail: string;
    status: string;
    pickupDate: string;
    returnDate: string;
  }[];
}

export function ConflictChecker({
  toolId,
  toolName,
  reservationId,
}: ConflictCheckerProps) {
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [result, setResult] = useState<ConflictData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheck = () => {
    if (!pickupDate || !returnDate) {
      setError("Please enter both pickup and return dates.");
      return;
    }
    if (pickupDate > returnDate) {
      setError("Pickup date must be before return date.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/reservations/conflicts?toolId=${toolId}&pickupDate=${pickupDate}&returnDate=${returnDate}&excludeId=${reservationId}`
        );
        const data = await res.json();
        setResult(data);
      } catch {
        setError("Failed to check conflicts.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Conflict Checker
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Check for overlapping reservations for{" "}
        <span className="font-medium">{toolName}</span>
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Pickup Date
          </label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Return Date
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {isPending ? "Checking…" : "Check"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          {result.hasConflict ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {result.conflicts.length} conflict
                {result.conflicts.length !== 1 ? "s" : ""} found
              </div>
              <ul className="space-y-2">
                {result.conflicts.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="font-medium">
                      {c.userName ?? c.userEmail}
                    </span>{" "}
                    — {c.status} ({c.pickupDate} → {c.returnDate})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              ✓ No conflicts found for this date range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}