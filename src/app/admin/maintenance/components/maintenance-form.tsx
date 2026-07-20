"use client";

import { useState, useTransition, useEffect } from "react";
import { createMaintenanceRecord } from "@/lib/actions/maintenance";
import { Plus, X } from "lucide-react";

export function MaintenanceForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [toolId, setToolId] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("routine");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");

  const [toolOptions, setToolOptions] = useState<
    { id: string; name: string; assetId: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && toolOptions.length === 0) {
      setLoading(true);
      fetch("/api/admin/dropdown/maintenance-tools")
        .then((r) => r.json())
        .then((data) => setToolOptions(data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, toolOptions.length]);

  const resetForm = () => {
    setToolId("");
    setMaintenanceType("routine");
    setDescription("");
    setCost("");
    setNotes("");
    setNextDueAt("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!toolId || !description.trim()) {
      setError("Tool and description are required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createMaintenanceRecord({
        toolId,
        maintenanceType: maintenanceType as any,
        description: description.trim(),
        cost: cost || undefined,
        notes: notes || undefined,
        nextDueAt: nextDueAt || undefined,
      });

      if (result.success) {
        setOpen(false);
        resetForm();
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Log Maintenance
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { setOpen(false); resetForm(); }}
      />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={() => { setOpen(false); resetForm(); }}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Log Maintenance
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tool *</label>
              <select
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select tool…</option>
                {toolOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.assetId ? ` (${t.assetId})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="calibration">Calibration</option>
                <option value="cleaning">Cleaning</option>
                <option value="replacement">Replacement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the maintenance performed…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Next Due</label>
                <input
                  type="datetime-local"
                  value={nextDueAt}
                  onChange={(e) => setNextDueAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => { setOpen(false); resetForm(); }}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Log Maintenance"}
          </button>
        </div>
      </div>
    </div>
  );
}