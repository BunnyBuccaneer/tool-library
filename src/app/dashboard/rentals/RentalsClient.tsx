"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReservationCard from "@/components/dashboard/ReservationCard";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import type { Reservation, Tool, Location } from "@/db/schema";

interface RentalsClientProps {
  rentals: { reservation: Reservation; tool: Tool; location: Location | null }[];
}

export default function RentalsClient({ rentals }: RentalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [returnId, setReturnId] = useState<string | null>(null);
  const [extendId, setExtendId] = useState<string | null>(null);
  const [newReturnDate, setNewReturnDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReturn = async () => {
    if (!returnId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${returnId}/return`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast("Tool returned successfully!", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to return", "error");
    } finally {
      setLoading(false);
      setReturnId(null);
    }
  };

  const handleExtend = async () => {
    if (!extendId || !newReturnDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${extendId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newReturnDate }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast("Return date extended!", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to extend", "error");
    } finally {
      setLoading(false);
      setExtendId(null);
      setNewReturnDate("");
    }
  };

  return (
    <>
      <div className="space-y-3">
        {rentals.map(({ reservation, tool, location }) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            tool={tool}
            location={location}
            actions={
              <>
                <button
                  onClick={() => setReturnId(reservation.id)}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  Return
                </button>
                <button
                  onClick={() => {
                    setExtendId(reservation.id);
                    setNewReturnDate("");
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Extend
                </button>
              </>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!returnId}
        title="Return Tool"
        message="Are you sure you want to mark this tool as returned?"
        confirmLabel={loading ? "Returning..." : "Return"}
        onConfirm={handleReturn}
        onCancel={() => setReturnId(null)}
      />

      {/* Extend dialog */}
      {extendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Extend Return Date
            </h3>
            <input
              type="date"
              value={newReturnDate}
              onChange={(e) => setNewReturnDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setExtendId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={loading || !newReturnDate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Extending..." : "Extend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
