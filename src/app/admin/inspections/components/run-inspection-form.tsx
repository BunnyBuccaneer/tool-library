"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startInspectionRun } from "@/lib/actions/inspections";
import { Plus, X } from "lucide-react";

export function RunInspectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [toolId, setToolId] = useState("");
  const [triggerType, setTriggerType] = useState<
    "checkout" | "checkin" | "manual"
  >("manual");

  const [templateOptions, setTemplateOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [toolOptions, setToolOptions] = useState<
    { id: string; name: string; assetId: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && templateOptions.length === 0) {
      setLoading(true);
      Promise.all([
        fetch("/api/admin/dropdown/inspection-templates").then((r) =>
          r.json()
        ),
        fetch("/api/admin/dropdown/inspection-tools").then((r) => r.json()),
      ])
        .then(([templates, toolsList]) => {
          setTemplateOptions(templates ?? []);
          setToolOptions(toolsList ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, templateOptions.length]);

  const resetForm = () => {
    setTemplateId("");
    setToolId("");
    setTriggerType("manual");
    setError(null);
  };

  const handleSubmit = () => {
    if (!templateId || !toolId) {
      setError("Template and tool are required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await startInspectionRun({
        templateId,
        toolId,
        triggerType,
      });

      if (result.success && result.id) {
        setOpen(false);
        resetForm();
        router.push(`/admin/inspections/${result.id}`);
      } else {
        setError(result.error ?? "Failed to start inspection.");
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
        New Inspection
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          resetForm();
        }}
      />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={() => {
            setOpen(false);
            resetForm();
          }}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Start New Inspection
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Template *
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select template…</option>
                {templateOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tool *
              </label>
              <select
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select tool…</option>
                {toolOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.assetId ? ` (${t.assetId})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) =>
                  setTriggerType(
                    e.target.value as "checkout" | "checkin" | "manual"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="checkout">Checkout</option>
                <option value="checkin">Check-in</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Starting…" : "Start Inspection"}
          </button>
        </div>
      </div>
    </div>
  );
}