"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTool } from "../[id]/actions";
import type { CategoryRecord, LocationRecord } from "@/lib/data/admin";

interface ToolCreateFormProps {
  categories: CategoryRecord[];
  locations: LocationRecord[];
}

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "checked_out", label: "Checked Out" },
  { value: "reserved", label: "Reserved" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const skillLevelOptions = [
  { value: "", label: "Not specified" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export default function ToolCreateForm({ categories, locations }: ToolCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createTool, {
    success: false,
    error: null,
  });

  return (
    <form action={formAction} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="assetId" className="block text-sm font-medium text-slate-700 mb-1">
              Asset ID
            </label>
            <input
              type="text"
              id="assetId"
              name="assetId"
              placeholder="e.g., TOOL-001"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Tool name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              placeholder="tool-name-slug"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Lowercase, hyphen-separated. Must be unique.
            </p>
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              placeholder="Brand name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              placeholder="Model number"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-slate-700 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              placeholder="Serial number"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Detailed description of the tool..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Classification & Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="locationId" className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <select
              id="locationId"
              name="locationId"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="available"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium text-slate-700 mb-1">
              Skill Level Required
            </label>
            <select
              id="skillLevel"
              name="skillLevel"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {skillLevelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="replacementCost" className="block text-sm font-medium text-slate-700 mb-1">
              Replacement Cost ($)
            </label>
            <input
              type="number"
              id="replacementCost"
              name="replacementCost"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              value="true"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active (visible in catalog)
            </label>
          </div>
        </div>
      </div>

      {/* Condition & Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Condition & Notes</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="conditionNotes" className="block text-sm font-medium text-slate-700 mb-1">
              Condition Notes
            </label>
            <textarea
              id="conditionNotes"
              name="conditionNotes"
              rows={3}
              placeholder="Current condition, wear, damage notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="safetyInfo" className="block text-sm font-medium text-slate-700 mb-1">
              Safety Information
            </label>
            <textarea
              id="safetyInfo"
              name="safetyInfo"
              rows={3}
              placeholder="Safety precautions, PPE requirements, warnings..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="specifications" className="block text-sm font-medium text-slate-700 mb-1">
              Specifications (JSON)
            </label>
            <textarea
              id="specifications"
              name="specifications"
              rows={5}
              placeholder='{"weight": "5kg", "power": "1200W", "voltage": "120V"}'
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter specifications as JSON object. Leave empty if none.
            </p>
          </div>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="userManualUrl" className="block text-sm font-medium text-slate-700 mb-1">
              User Manual URL
            </label>
            <input
              type="url"
              id="userManualUrl"
              name="userManualUrl"
              placeholder="https://example.com/manual.pdf"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="quickStartGuideUrl" className="block text-sm font-medium text-slate-700 mb-1">
              Quick Start Guide URL
            </label>
            <input
              type="url"
              id="quickStartGuideUrl"
              name="quickStartGuideUrl"
              placeholder="https://example.com/quickstart.pdf"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
        <Link
          href="/admin/tools"
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating..." : "Create Tool"}
        </button>
      </div>
    </form>
  );
}