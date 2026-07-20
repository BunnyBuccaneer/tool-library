"use client";

import { useState, useTransition } from "react";
import { createCertType, updateCertType } from "@/lib/actions/certifications";
import { Plus, Pencil, X } from "lucide-react";

interface CertTypeFormProps {
  mode: "create" | "edit";
  certType?: {
    id: string;
    name: string;
    description: string | null;
    validityMonths: number | null;
    isRequired: boolean;
    sortOrder: number;
  };
}

export function CertTypeForm({ mode, certType }: CertTypeFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(certType?.name ?? "");
  const [description, setDescription] = useState(
    certType?.description ?? ""
  );
  const [validityMonths, setValidityMonths] = useState(
    certType?.validityMonths?.toString() ?? ""
  );
  const [isRequired, setIsRequired] = useState(certType?.isRequired ?? false);
  const [sortOrder, setSortOrder] = useState(
    certType?.sortOrder?.toString() ?? "0"
  );

  const resetForm = () => {
    if (mode === "create") {
      setName("");
      setDescription("");
      setValidityMonths("");
      setIsRequired(false);
      setSortOrder("0");
    }
    setError(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        validityMonths: validityMonths ? parseInt(validityMonths, 10) : undefined,
        isRequired,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      let result;
      if (mode === "create") {
        result = await createCertType(payload);
      } else if (certType) {
        result = await updateCertType(certType.id, payload);
      } else {
        return;
      }

      if (result.success) {
        setOpen(false);
        resetForm();
      } else {
        setError(result.error ?? "An error occurred.");
      }
    });
  };

  if (!open) {
    return mode === "create" ? (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        New Cert Type
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
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
          {mode === "create"
            ? "New Certification Type"
            : "Edit Certification Type"}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table Saw Safety"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this certification cover?"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Validity (months)
              </label>
              <input
                type="number"
                value={validityMonths}
                onChange={(e) => setValidityMonths(e.target.value)}
                placeholder="Leave blank for lifetime"
                min={1}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min={0}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Required certification (blocks checkout without it)
          </label>
        </div>

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
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}