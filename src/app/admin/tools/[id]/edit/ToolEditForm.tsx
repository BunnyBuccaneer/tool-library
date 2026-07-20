"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateTool } from "../actions";
import type { ToolDetailRecord, CategoryRecord, LocationRecord } from "@/lib/data/admin";

interface ToolEditFormProps {
  tool: ToolDetailRecord;
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

export default function ToolEditForm({ tool, categories, locations }: ToolEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateTool, {
    success: false,
    error: null,
  });

  // Convert specifications to JSON string for textarea
  const specificationsStr = tool.specifications
    ? JSON.stringify(tool.specifications, null, 2)
    : "";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={tool.id} />

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset ID */}
          <div>
            <label htmlFor="assetId" className="block text-sm font-medium text-slate-700 mb-1">
              Asset ID
            </label>
            <input
              type="text"
              id="assetId"
              name="assetId"
              defaultValue={tool.assetId || ""}
              placeholder="e.g., TOOL-001"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={tool.name}
              placeholder="Tool name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              defaultValue={tool.slug}
              placeholder="tool-name-slug"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              defaultValue={tool.brand || ""}
              placeholder="Brand name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              defaultValue={tool.model || ""}
              placeholder="Model number"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Serial Number */}
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-slate-700 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              defaultValue={tool.serialNumber || ""}
              placeholder="Serial number"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              defaultValue={tool.imageUrl || ""}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={tool.description || ""}
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
          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={tool.categoryId || ""}
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

          {/* Location */}
          <div>
            <label htmlFor="locationId" className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <select
              id="locationId"
              name="locationId"
              defaultValue={tool.locationId || ""}
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

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={tool.status}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Level */}
          <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium text-slate-700 mb-1">
              Skill Level Required
            </label>
            <select
              id="skillLevel"
              name="skillLevel"
              defaultValue={tool.skillLevel || ""}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {skillLevelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Replacement Cost */}
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
              defaultValue={tool.replacementCost || ""}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              value="true"
              defaultChecked={tool.isActive}
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
          {/* Condition Notes */}
          <div>
            <label htmlFor="conditionNotes" className="block text-sm font-medium text-slate-700 mb-1">
              Condition Notes
            </label>
            <textarea
              id="conditionNotes"
              name="conditionNotes"
              rows={3}
              defaultValue={tool.conditionNotes || ""}
              placeholder="Current condition, wear, damage notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Safety Info */}
          <div>
            <label htmlFor="safetyInfo" className="block text-sm font-medium text-slate-700 mb-1">
              Safety Information
            </label>
            <textarea
              id="safetyInfo"
              name="safetyInfo"
              rows={3}
              defaultValue={tool.safetyInfo || ""}
              placeholder="Safety precautions, PPE requirements, warnings..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Specifications (JSON) */}
          <div>
            <label htmlFor="specifications" className="block text-sm font-medium text-slate-700 mb-1">
              Specifications (JSON)
            </label>
            <textarea
              id="specifications"
              name="specifications"
              rows={5}
              defaultValue={specificationsStr}
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
          {/* User Manual URL */}
          <div>
            <label htmlFor="userManualUrl" className="block text-sm font-medium text-slate-700 mb-1">
              User Manual URL
            </label>
            <input
              type="url"
              id="userManualUrl"
              name="userManualUrl"
              defaultValue={tool.userManualUrl || ""}
              placeholder="https://example.com/manual.pdf"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Start Guide URL */}
          <div>
            <label htmlFor="quickStartGuideUrl" className="block text-sm font-medium text-slate-700 mb-1">
              Quick Start Guide URL
            </label>
            <input
              type="url"
              id="quickStartGuideUrl"
              name="quickStartGuideUrl"
              defaultValue={tool.quickStartGuideUrl || ""}
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
          href={`/admin/tools/${tool.id}`}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
