"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReservationCard from "@/components/dashboard/ReservationCard";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import type { Reservation, Tool, Location } from "@/db/schema";

interface Props {
  reservations: {
    reservation: Reservation;
    tool: Tool;
    location: Location | null;
  }[];
}

export default function ReservationsClient({ reservations }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [modifyData, setModifyData] = useState({
    pickupDate: "",
    returnDate: "",
    pickupTime: "",
    returnTime: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!cancelId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${cancelId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast("Reservation cancelled", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to cancel", "error");
    } finally {
      setLoading(false);
      setCancelId(null);
    }
  };

  const handleModify = async () => {
    if (!modifyId) return;
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (modifyData.pickupDate) body.pickupDate = modifyData.pickupDate;
      if (modifyData.returnDate) body.returnDate = modifyData.returnDate;
      if (modifyData.pickupTime) body.pickupTime = modifyData.pickupTime;
      if (modifyData.returnTime) body.returnTime = modifyData.returnTime;

      const res = await fetch(`/api/reservations/${modifyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast("Reservation updated", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to modify", "error");
    } finally {
      setLoading(false);
      setModifyId(null);
    }
  };

  const openModify = (r: Reservation) => {
    setModifyId(r.id);
    setModifyData({
      pickupDate: r.pickupDate,
      returnDate: r.returnDate,
      pickupTime: r.pickupTime ?? "",
      returnTime: r.returnTime ?? "",
    });
  };

  return (
    <>
      <div className="space-y-3">
        {reservations.map(({ reservation, tool, location }) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            tool={tool}
            location={location}
            actions={
              <>
                <button
                  onClick={() => openModify(reservation)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Modify
                </button>
                <button
                  onClick={() => setCancelId(reservation.id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Cancel
                </button>
              </>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Reservation"
        message="Are you sure? The tool will become available for others."
        confirmLabel={loading ? "Cancelling..." : "Cancel Reservation"}
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
        destructive
      />

      {modifyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Modify Reservation
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={modifyData.pickupDate}
                  onChange={(e) =>
                    setModifyData((d) => ({
                      ...d,
                      pickupDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  value={modifyData.returnDate}
                  onChange={(e) =>
                    setModifyData((d) => ({
                      ...d,
                      returnDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={modifyData.pickupTime}
                  onChange={(e) =>
                    setModifyData((d) => ({
                      ...d,
                      pickupTime: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Return Time
                </label>
                <input
                  type="time"
                  value={modifyData.returnTime}
                  onChange={(e) =>
                    setModifyData((d) => ({
                      ...d,
                      returnTime: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModifyId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModify}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
