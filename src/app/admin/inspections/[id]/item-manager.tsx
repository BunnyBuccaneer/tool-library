"use client";

import { useState, useTransition } from "react";
import {
  addTemplateItem,
  removeTemplateItem,
} from "@/lib/actions/inspections";
import type { TemplateItemRecord } from "@/lib/data/inspections";
import { Plus, Trash2, X } from "lucide-react";

interface ItemManagerProps {
  templateId: string;
  existingItems: TemplateItemRecord[];
}

export function ItemManager({ templateId, existingItems }: ItemManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [sortOrder, setSortOrder] = useState(
    String((existingItems.length + 1) * 10)
  );

  const resetForm = () => {
    setLabel("");
    setDescription("");
    setIsCritical(false);
    setSortOrder(String((existingItems.length + 2) * 10));
    setError(null);
  };

  const handleAdd = () => {
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await addTemplateItem({
        templateId,
        label: label.trim(),
        description: description.trim() || undefined,
        isCritical,
        sortOrder: parseInt(sortOrder, 10) || 0,
      });

      if (result.success) {
        setShowForm(false);
        resetForm();
      } else {
        setError(result.error ?? "Failed to add item.");
      }
    });
  };

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      await removeTemplateItem(itemId, templateId);
    });
  };

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Checklist Item
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">
              Add Checklist Item
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
                Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Power cord is intact and undamaged"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional guidance for the inspector"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min={0}
                  className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 pt-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                Critical (auto-flags for repair)
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                disabled={isPending}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add Item"}
              </button>
            </div>
          </div>

          {/* Remove existing items */}
          {existingItems.length > 0 && (
            <div className="mt-4 border-t border-blue-200 pt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Remove existing items:
              </p>
              <div className="space-y-1">
                {existingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isPending}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}