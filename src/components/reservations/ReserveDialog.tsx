"use client";

import { useState } from "react";
import AvailabilityCalendar from "@/components/dashboard/AvailabilityCalendar";

interface ReserveDialogProps {
  toolId: string;
  toolName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export default function ReserveDialog({
  toolId,
  toolName,
  open,
  onClose,
  onSuccess,
}: ReserveDialogProps) {
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!pickupDate || !returnDate) {
      setError("Please select pickup and return dates");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reservations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          pickupDate,
          returnDate,
          pickupTime: pickupTime || null,
          returnTime: returnTime || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to reserve");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(false);
        setPickupDate("");
        setReturnDate("");
        setPickupTime("");
        setReturnTime("");
        setNotes("");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reserve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Reserve {toolName}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100 text-slate-400"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-600 font-medium">
              Reservation created successfully!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <AvailabilityCalendar
                toolId={toolId}
                onSelectDates={(p, r) => {
                  setPickupDate(p);
                  setReturnDate(r);
                }}
                selectedPickup={pickupDate}
                selectedReturn={returnDate}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pickup Time (optional)
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Any time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Return Time (optional)
                </label>
                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Any time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            {pickupDate && returnDate && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                📅 {pickupDate} → {returnDate}
                {pickupTime && ` (pickup at ${pickupTime})`}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !pickupDate || !returnDate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Reserving..." : "Reserve Tool"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
