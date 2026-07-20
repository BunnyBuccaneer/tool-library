"use client";

import { useState, useTransition } from "react";
import { assignStaff } from "@/lib/actions/maintenance";
import { UserPlus, X } from "lucide-react";

interface AssignStaffFormProps {
  maintenanceRecordId: string;
  staffOptions: { id: string; name: string; email: string }[];
}

export function AssignStaffForm({
  maintenanceRecordId,
  staffOptions,
}: AssignStaffFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!staffId) {
      setError("Select a staff member.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await assignStaff({
        maintenanceRecordId,
        assignedToId: staffId,
        notes: notes || undefined,
      });

      if (result.success) {
        setOpen(false);
        setStaffId("");
        setNotes("");
        setError(null);
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <UserPlus className="h-4 w-4" />
        Assign Staff
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">Assign Staff</h4>
        <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select staff member…</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email} ({s.email})
            </option>
          ))}
        </select>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Assignment notes (optional)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}