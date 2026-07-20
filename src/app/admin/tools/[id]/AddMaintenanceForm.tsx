"use client";

import { useActionState } from "react";
import { addMaintenanceRecord } from "./actions";

interface AddMaintenanceFormProps {
  toolId: string;
  adminUserId: string;
}

const maintenanceTypes = [
  { value: "routine", label: "Routine Maintenance" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "calibration", label: "Calibration" },
  { value: "cleaning", label: "Cleaning" },
  { value: "replacement", label: "Part Replacement" },
  { value: "other", label: "Other" },
];

export default function AddMaintenanceForm({ toolId, adminUserId }: AddMaintenanceFormProps) {
  const [state, formAction, isPending] = useActionState(addMaintenanceRecord, {
    success: false,
    error: null,
  });

  return (
    <form action={formAction} className="bg-slate-50 rounded-lg p-4">
      <input type="hidden" name="toolId" value={toolId} />
      <input type="hidden" name="performedById" value={adminUserId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maintenance Type */}
        <div>
          <label htmlFor="maintenanceType" className="block text-sm font-medium text-slate-700 mb-1">
            Maintenance Type <span className="text-red-500">*</span>
          </label>
          <select
            id="maintenanceType"
            name="maintenanceType"
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select type...</option>
            {maintenanceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cost */}
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-slate-700 mb-1">
            Cost ($)
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Performed At */}
        <div>
          <label htmlFor="performedAt" className="block text-sm font-medium text-slate-700 mb-1">
            Date Performed <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="performedAt"
            name="performedAt"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Next Due At */}
        <div>
          <label htmlFor="nextDueAt" className="block text-sm font-medium text-slate-700 mb-1">
            Next Due Date
          </label>
          <input
            type="date"
            id="nextDueAt"
            name="nextDueAt"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description - Full Width */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="description"
            name="description"
            required
            placeholder="Brief description of work performed..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes - Full Width */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Any additional notes..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Success Message */}
      {state.success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">Maintenance record added successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Adding..." : "Add Maintenance Record"}
        </button>
      </div>
    </form>
  );
}
