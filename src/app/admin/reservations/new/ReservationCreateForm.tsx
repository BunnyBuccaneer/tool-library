"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createReservationAsAdmin } from "@/lib/actions/reservations";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Location {
  id: string;
  name: string;
}

interface Tool {
  id: string;
  name: string;
  assetId: string | null;
  status: string;
}

interface ReservationCreateFormProps {
  members: Member[];
  locations: Location[];
  tools: Tool[];
}

interface ConflictResult {
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

export default function ReservationCreateForm({
  members,
  locations,
  tools,
}: ReservationCreateFormProps) {
  const [state, formAction, isPending] = useActionState(
    createReservationAsAdmin,
    { success: false, error: null }
  );

  const [toolId, setToolId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(
    null
  );
  const [isCheckingConflict, startConflictCheck] = useTransition();

  // Auto-check conflicts when tool + dates are all set
  useEffect(() => {
    if (!toolId || !pickupDate || !returnDate) {
      setConflictResult(null);
      return;
    }
    if (pickupDate > returnDate) {
      setConflictResult(null);
      return;
    }

    startConflictCheck(async () => {
      try {
        const res = await fetch(
          `/api/admin/reservations/conflicts?toolId=${toolId}&pickupDate=${pickupDate}&returnDate=${returnDate}`
        );
        const data = await res.json();
        setConflictResult(data);
      } catch {
        setConflictResult(null);
      }
    });
  }, [toolId, pickupDate, returnDate]);

  const selectedTool = tools.find((t) => t.id === toolId);

  return (
    <form action={formAction} className="space-y-6">
      {/* Member & Tool */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Member & Tool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Member <span className="text-red-500">*</span>
            </label>
            <select
              id="userId"
              name="userId"
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ? `${m.name} (${m.email})` : m.email}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                No members found. Add members before creating reservations.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="toolId"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Tool <span className="text-red-500">*</span>
            </label>
            <select
              id="toolId"
              name="toolId"
              required
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a tool…</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.assetId ? ` [${t.assetId}]` : ""} — {t.status}
                </option>
              ))}
            </select>
            {selectedTool && selectedTool.status !== "available" && (
              <p className="mt-1 text-xs text-orange-600">
                ⚠ Tool is currently <strong>{selectedTool.status}</strong>. You
                can still create a reservation for future dates.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="locationId"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Location
            </label>
            <select
              id="locationId"
              name="locationId"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Use tool&apos;s default location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Initial Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="confirmed"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="confirmed">Confirmed (auto-approved)</option>
              <option value="pending">Pending (requires approval)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dates & Times */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Pickup & Return
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="pickupDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Pickup Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="pickupDate"
              name="pickupDate"
              required
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="pickupTime"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Pickup Time
            </label>
            <input
              type="time"
              id="pickupTime"
              name="pickupTime"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="returnDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="returnDate"
              name="returnDate"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="returnTime"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Return Time
            </label>
            <input
              type="time"
              id="returnTime"
              name="returnTime"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Live conflict check */}
        {toolId && pickupDate && returnDate && pickupDate <= returnDate && (
          <div className="mt-4">
            {isCheckingConflict ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Checking availability…
              </div>
            ) : conflictResult ? (
              conflictResult.hasConflict ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    {conflictResult.conflicts.length} conflict
                    {conflictResult.conflicts.length !== 1 ? "s" : ""} for this
                    tool in that date range
                  </div>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {conflictResult.conflicts.map((c) => (
                      <li key={c.id}>
                        • <strong>{c.userName ?? c.userEmail}</strong> —{" "}
                        {c.status} ({c.pickupDate} → {c.returnDate})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Tool is available for those dates.
                </div>
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Notes</h2>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Optional notes for this reservation…"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Error */}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <Link
          href="/admin/reservations"
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || (conflictResult?.hasConflict ?? false)}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isPending ? "Creating…" : "Create Reservation"}
        </button>
      </div>
    </form>
  );
}