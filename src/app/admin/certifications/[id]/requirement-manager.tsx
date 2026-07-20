"use client";

import { useState, useTransition } from "react";
import {
  addCertRequirement,
  removeCertRequirement,
} from "@/lib/actions/certifications";
import type { CertRequirementRecord } from "@/lib/data/certifications";
import { Plus, Trash2, X } from "lucide-react";

interface RequirementManagerProps {
  certTypeId: string;
  existingRequirements: CertRequirementRecord[];
  categoryOptions: { id: string; name: string }[];
  toolOptions: { id: string; name: string }[];
}

export function RequirementManager({
  certTypeId,
  existingRequirements,
  categoryOptions,
  toolOptions,
}: RequirementManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<"category" | "tool">(
    "category"
  );
  const [selectedId, setSelectedId] = useState("");

  const handleAdd = () => {
    if (!selectedId) {
      setError("Please select a category or tool.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await addCertRequirement({
        certificationTypeId: certTypeId,
        categoryId: targetType === "category" ? selectedId : undefined,
        toolId: targetType === "tool" ? selectedId : undefined,
      });

      if (result.success) {
        setShowForm(false);
        setSelectedId("");
      } else {
        setError(result.error ?? "Failed to add requirement.");
      }
    });
  };

  const handleRemove = (reqId: string) => {
    startTransition(async () => {
      await removeCertRequirement(reqId, certTypeId);
    });
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
      >
        <Plus className="h-4 w-4" />
        Add Requirement
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">
          Add Requirement
        </h4>
        <button
          onClick={() => {
            setShowForm(false);
            setError(null);
          }}
          className="rounded p-1 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Type
          </label>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as "category" | "tool");
              setSelectedId("");
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="category">Category</option>
            <option value="tool">Tool</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {targetType === "category" ? "Category" : "Tool"}
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              Select {targetType === "category" ? "category" : "tool"}…
            </option>
            {(targetType === "category" ? categoryOptions : toolOptions).map(
              (opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* Inline remove buttons for existing requirements */}
      {existingRequirements.length > 0 && (
        <div className="mt-4 border-t border-blue-200 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Remove existing:
          </p>
          <div className="space-y-1">
            {existingRequirements.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5"
              >
                <span className="text-sm text-slate-700">
                  {req.categoryName ?? req.toolName ?? "Unknown"}
                </span>
                <button
                  onClick={() => handleRemove(req.id)}
                  disabled={isPending}
                  className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Remove requirement"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}