"use client";

import { useState, useTransition } from "react";
import type { RunDetailRecord } from "@/lib/data/inspections";
import { submitInspectionResults } from "@/lib/actions/inspections";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  SkipForward,
  AlertTriangle,
} from "lucide-react";

interface InspectionDetailViewProps {
  run: RunDetailRecord;
}

type ItemResult = "pass" | "fail" | "na" | "skipped";

export function InspectionDetailView({ run }: InspectionDetailViewProps) {
  const isEditable = run.status === "in_progress";

  const [itemResults, setItemResults] = useState<
    Record<string, { result: ItemResult; notes: string }>
  >(() => {
    const initial: Record<string, { result: ItemResult; notes: string }> = {};
    for (const item of run.items) {
      initial[item.id] = {
        result: item.result as ItemResult,
        notes: item.notes ?? "",
      };
    }
    return initial;
  });

  const [overallNotes, setOverallNotes] = useState(run.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setItemResult = (itemId: string, result: ItemResult) => {
    setItemResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], result },
    }));
  };

  const setItemNotes = (itemId: string, notes: string) => {
    setItemResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], notes },
    }));
  };

  const handleSubmit = () => {
    setError(null);
    setSuccess(false);

    const items = Object.entries(itemResults).map(([id, data]) => ({
      id,
      result: data.result,
      notes: data.notes || undefined,
    }));

    startTransition(async () => {
      const result = await submitInspectionResults(run.id, {
        items,
        overallNotes: overallNotes || undefined,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Failed to submit.");
      }
    });
  };

  const resultIcon = (result: string) => {
    switch (result) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "na":
        return <MinusCircle className="h-5 w-5 text-slate-400" />;
      default:
        return <SkipForward className="h-5 w-5 text-slate-300" />;
    }
  };

  const resultBtnClass = (current: ItemResult, target: ItemResult) => {
    const base =
      "rounded-lg border px-3 py-1.5 text-xs font-medium transition";
    if (current === target) {
      switch (target) {
        case "pass":
          return `${base} border-green-500 bg-green-50 text-green-700`;
        case "fail":
          return `${base} border-red-500 bg-red-50 text-red-700`;
        case "na":
          return `${base} border-slate-400 bg-slate-100 text-slate-600`;
        default:
          return `${base} border-slate-300 bg-slate-50 text-slate-500`;
      }
    }
    return `${base} border-slate-200 bg-white text-slate-500 hover:bg-slate-50`;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Inspection submitted successfully!
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        {run.items.map((item, idx) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 ${
              item.isCritical
                ? "border-orange-200 bg-orange-50/30"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    {item.isCritical && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        Critical
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              {!isEditable && (
                <div className="flex-shrink-0">
                  {resultIcon(itemResults[item.id]?.result ?? "skipped")}
                </div>
              )}
            </div>

            {isEditable && (
              <div className="mt-3 space-y-2 pl-9">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setItemResult(item.id, "pass")}
                    className={resultBtnClass(
                      itemResults[item.id]?.result ?? "skipped",
                      "pass"
                    )}
                  >
                    ✓ Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemResult(item.id, "fail")}
                    className={resultBtnClass(
                      itemResults[item.id]?.result ?? "skipped",
                      "fail"
                    )}
                  >
                    ✗ Fail
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemResult(item.id, "na")}
                    className={resultBtnClass(
                      itemResults[item.id]?.result ?? "skipped",
                      "na"
                    )}
                  >
                    N/A
                  </button>
                </div>
                <input
                  type="text"
                  value={itemResults[item.id]?.notes ?? ""}
                  onChange={(e) => setItemNotes(item.id, e.target.value)}
                  placeholder="Item notes (optional)"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall notes */}
      {isEditable && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Overall Notes
          </label>
          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            rows={3}
            placeholder="General observations about this inspection…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Submit */}
      {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Submit Inspection"}
          </button>
        </div>
      )}
    </div>
  );
}