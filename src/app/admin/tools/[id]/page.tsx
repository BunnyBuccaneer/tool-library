import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getToolById,
  getToolImages,
  getToolAccessories,
  getToolReservations,
  getToolMaintenanceRecords,
  getNextMaintenanceDue,
} from "@/lib/data/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import ToolDetailTabs from "./ToolDetailTabs";
import AddMaintenanceForm from "./AddMaintenanceForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolDetailPage({ params }: PageProps) {
  const adminUser = await requireAdminAuth();
  const { id } = await params;

  const [tool, images, accessories, reservations, maintenanceRecords, nextMaintenanceDue] =
    await Promise.all([
      getToolById(id),
      getToolImages(id),
      getToolAccessories(id),
      getToolReservations(id, 20),
      getToolMaintenanceRecords(id, 20),
      getNextMaintenanceDue(id),
    ]);

  if (!tool) {
    notFound();
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "checked_out":
        return "bg-blue-100 text-blue-700";
      case "reserved":
        return "bg-purple-100 text-purple-700";
      case "maintenance":
        return "bg-orange-100 text-orange-700";
      case "retired":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  let specifications: Record<string, string> = {};
  if (tool.specifications) {
    try {
      if (typeof tool.specifications === "object") {
        specifications = tool.specifications as Record<string, string>;
      } else if (typeof tool.specifications === "string") {
        specifications = JSON.parse(tool.specifications);
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/tools" className="text-slate-500 hover:text-slate-700">
            Tools
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium">{tool.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tools/${tool.id}/edit`}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Tool
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {tool.imageUrl ? (
              <img
                src={tool.imageUrl}
                alt={tool.name}
                className="w-32 h-32 rounded-xl object-cover bg-slate-100"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{tool.name}</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {tool.brand && tool.model
                    ? `${tool.brand} ${tool.model}`
                    : tool.brand || tool.model || "No brand/model specified"}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(tool.status)}`}>
                {tool.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Asset ID</p>
                <p className="text-sm font-mono font-medium text-slate-900 mt-1">
                  {tool.assetId || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Serial Number</p>
                <p className="text-sm font-mono font-medium text-slate-900 mt-1">
                  {tool.serialNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {tool.categoryName || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {tool.locationName || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToolDetailTabs
        tool={tool}
        images={images}
        accessories={accessories}
        reservations={reservations}
        maintenanceRecords={maintenanceRecords}
        nextMaintenanceDue={nextMaintenanceDue}
        specifications={specifications}
        addMaintenanceForm={
          <AddMaintenanceForm toolId={tool.id} adminUserId={adminUser.id} />
        }
      />
    </div>
  );
}
