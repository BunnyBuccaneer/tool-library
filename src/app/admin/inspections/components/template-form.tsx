"use client";

import { useState, useTransition } from "react";
import { createTemplate, updateTemplate } from "@/lib/actions/inspections";
import { Plus, Pencil, X } from "lucide-react";

interface TemplateFormProps {
  mode: "create" | "edit";
  categoryOptions: { id: string; name: string }[];
  template?: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    triggerType: string;
    sortOrder: number;
  };
}

export function TemplateForm({
  mode,
  categoryOptions,
  template,
}: TemplateFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(
    template?.description ?? ""
  );
  const [categoryId, setCategoryId] = useState(template?.categoryId ?? "");
  const [triggerType, setTriggerType] = useState(
    template?.triggerType ?? "both"
  );
  const [sortOrder, setSortOrder] = useState(
    template?.sortOrder?.toString() ?? "0"
  );

  const resetForm = () => {
    if (mode === "create") {
      setName("");
      setDescription("");
      setCategoryId("");
      setTriggerType("both");
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
        categoryId: categoryId || undefined,
        triggerType: triggerType as any,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      let result;
      if (mode === "create") {
        result = await createTemplate(payload);
      } else if (template) {
        result = await updateTemplate(template.id, payload);
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
        New Template
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
          {mode === "create" ? "New Inspection Template" : "Edit Template"}
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
              placeholder="e.g. Power Tool Safety Check"
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
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Category (optional)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Trigger
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="checkout">Checkout</option>
                <option value="checkin">Check-in</option>
                <option value="both">Both</option>
                <option value="manual">Manual</option>
              </select>
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
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