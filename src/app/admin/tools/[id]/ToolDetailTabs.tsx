"use client";

import { useState, type ReactNode } from "react";
import type { ToolDetailRecord, ToolImageRecord, ToolAccessoryRecord, ToolReservationRecord, MaintenanceRecord } from "@/lib/data/admin";

interface ToolDetailTabsProps {
  tool: ToolDetailRecord;
  images: ToolImageRecord[];
  accessories: ToolAccessoryRecord[];
  reservations: ToolReservationRecord[];
  maintenanceRecords: MaintenanceRecord[];
  nextMaintenanceDue: Date | null;
  specifications: Record<string, string>;
  addMaintenanceForm: ReactNode;
}

type TabId = "overview" | "photos" | "accessories" | "documents" | "reservations" | "maintenance";

const tabs: { id: TabId; name: string }[] = [
  { id: "overview", name: "Overview" },
  { id: "photos", name: "Photos" },
  { id: "accessories", name: "Accessories" },
  { id: "documents", name: "Documents" },
  { id: "reservations", name: "Reservation History" },
  { id: "maintenance", name: "Maintenance" },
];

function getReservationStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "checked_out":
      return "bg-green-100 text-green-700";
    case "returned":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "overdue":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getMaintenanceTypeBadgeClass(type: string) {
  switch (type) {
    case "routine":
      return "bg-blue-100 text-blue-700";
    case "repair":
      return "bg-red-100 text-red-700";
    case "inspection":
      return "bg-purple-100 text-purple-700";
    case "calibration":
      return "bg-cyan-100 text-cyan-700";
    case "cleaning":
      return "bg-green-100 text-green-700";
    case "replacement":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ToolDetailTabs({
  tool,
  images,
  accessories,
  reservations,
  maintenanceRecords,
  nextMaintenanceDue,
  specifications,
  addMaintenanceForm,
}: ToolDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.name}
              {tab.id === "reservations" && reservations.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                  {reservations.length}
                </span>
              )}
              {tab.id === "maintenance" && maintenanceRecords.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                  {maintenanceRecords.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Asset ID</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.assetId || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Brand</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.brand || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Model</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.model || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Serial Number</p>
                  <p className="text-sm font-mono font-medium text-slate-900 mt-1">{tool.serialNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.categoryName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.locationName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <p className="text-sm font-medium text-slate-900 mt-1 capitalize">{tool.status.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Skill Level</p>
                  <p className="text-sm font-medium text-slate-900 mt-1 capitalize">{tool.skillLevel || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Replacement Cost</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {tool.replacementCost ? `$${parseFloat(tool.replacementCost).toLocaleString()}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{tool.isActive ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {new Date(tool.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {tool.description && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Description</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{tool.description}</p>
              </div>
            )}

            {/* Condition Notes */}
            {tool.conditionNotes && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Condition Notes</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{tool.conditionNotes}</p>
              </div>
            )}

            {/* Specifications */}
            {Object.keys(specifications).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Specifications</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-sm text-slate-500">{key}</dt>
                        <dd className="text-sm font-medium text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Safety Info */}
            {tool.safetyInfo && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Safety Information</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-orange-800 whitespace-pre-wrap">{tool.safetyInfo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tool Photos</h3>
            {images.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No photos uploaded for this tool</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.imageUrl}
                      alt={image.altText || tool.name}
                      className="w-full aspect-square rounded-lg object-cover bg-slate-100"
                    />
                    {image.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accessories Tab */}
        {activeTab === "accessories" && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Included Accessories</h3>
            {accessories.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No accessories listed for this tool</p>
            ) : (
              <div className="space-y-3">
                {accessories.map((accessory) => (
                  <div
                    key={accessory.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {accessory.isIncluded ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{accessory.name}</p>
                        {accessory.description && (
                          <p className="text-xs text-slate-500">{accessory.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${accessory.isIncluded ? "text-green-600" : "text-slate-500"}`}>
                      {accessory.isIncluded ? "Included" : "Optional"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Documentation</h3>
              <div className="space-y-3">
                {tool.userManualUrl ? (
                  <a
                    href={tool.userManualUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">User Manual</p>
                      <p className="text-xs text-slate-500">Complete operation guide</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">User Manual</p>
                      <p className="text-xs text-slate-400">Not available</p>
                    </div>
                  </div>
                )}

                {tool.quickStartGuideUrl ? (
                  <a
                    href={tool.quickStartGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Quick Start Guide</p>
                      <p className="text-xs text-slate-500">Get started quickly</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Quick Start Guide</p>
                      <p className="text-xs text-slate-400">Not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Info in Documents tab too */}
            {tool.safetyInfo && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Safety Information</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-orange-800 whitespace-pre-wrap">{tool.safetyInfo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reservation History</h3>
            {reservations.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No reservations found for this tool</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Member</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pickup Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Return Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-slate-900">{res.memberName || res.memberEmail}</p>
                          <p className="text-xs text-slate-500">{res.memberEmail}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{res.pickupDate}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{res.returnDate}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{res.locationName || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getReservationStatusBadgeClass(res.status)}`}>
                            {res.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">
                          {res.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="space-y-6">
            {/* Next Due Alert */}
            {nextMaintenanceDue && (
              <div className={`p-4 rounded-lg ${
                new Date(nextMaintenanceDue) < new Date()
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
              }`}>
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 ${
                    new Date(nextMaintenanceDue) < new Date() ? "text-red-500" : "text-blue-500"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${
                      new Date(nextMaintenanceDue) < new Date() ? "text-red-800" : "text-blue-800"
                    }`}>
                      {new Date(nextMaintenanceDue) < new Date()
                        ? "Maintenance Overdue"
                        : "Next Maintenance Due"}
                    </p>
                    <p className={`text-xs ${
                      new Date(nextMaintenanceDue) < new Date() ? "text-red-600" : "text-blue-600"
                    }`}>
                      {new Date(nextMaintenanceDue).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Maintenance Form */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Maintenance Record</h3>
              {addMaintenanceForm}
            </div>

            {/* Maintenance History */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance History</h3>
              {maintenanceRecords.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No maintenance records found</p>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getMaintenanceTypeBadgeClass(record.maintenanceType)}`}>
                            {record.maintenanceType}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{record.description}</p>
                            {record.notes && (
                              <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-slate-500">
                                {new Date(record.performedAt).toLocaleDateString()}
                              </span>
                              {record.performedByName && (
                                <span className="text-xs text-slate-500">
                                  By: {record.performedByName}
                                </span>
                              )}
                              {record.cost && (
                                <span className="text-xs text-slate-600 font-medium">
                                  Cost: ${parseFloat(record.cost).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {record.nextDueAt && (
                              <p className="text-xs text-blue-600 mt-1">
                                Next due: {new Date(record.nextDueAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}