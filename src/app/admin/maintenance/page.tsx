import { requireAdminAuth } from "@/lib/admin-auth";
import { getMaintenanceTools, getToolStatusSummary } from "@/lib/data/admin";
import {
  getAllMaintenanceRecords,
  getAllSchedules,
  getMaintenanceStats,
  getOverdueSchedules,
} from "@/lib/data/maintenance";
import { PageHeader } from "@/components/admin/page-header";
import {
  Wrench,
  Calendar,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";
import { MaintenanceTable } from "./components/maintenance-table";
import { OverdueAlerts } from "./components/overdue-alerts";
import { MaintenanceForm } from "./components/maintenance-form";
import { ScheduleForm } from "./components/schedule-form";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    maintenanceType?: string;
    status?: string;
    overdue?: string;
    tab?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Maintenance | Admin",
  description: "Schedule, track, and manage tool maintenance",
};

// ─── Local UI helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    checked_out: "bg-blue-100 text-blue-800",
    reserved: "bg-purple-100 text-purple-800",
    maintenance: "bg-orange-100 text-orange-800",
    retired: "bg-slate-100 text-slate-800",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
        styles[status] || "bg-slate-100 text-slate-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: "red" | "orange" | "green" | "blue" | "slate";
}) {
  const valueColor =
    color === "red"
      ? "text-red-600"
      : color === "orange"
        ? "text-orange-600"
        : color === "green"
          ? "text-green-600"
          : color === "blue"
            ? "text-blue-600"
            : color === "slate"
              ? "text-slate-600"
              : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-0.5 text-xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function TabLink({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current: string;
}) {
  const isActive = current === value;
  return (
    <a
      href={`/admin/maintenance?tab=${value}`}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </a>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Wrench className="w-12 h-12 text-slate-300 mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function AdminMaintenancePage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "records";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // Fetch everything in parallel
  const [
    stats,
    overdueSchedules,
    maintenanceTools,
    statusSummary,
  ] = await Promise.all([
    getMaintenanceStats(),
    getOverdueSchedules(5),
    getMaintenanceTools(100),
    getToolStatusSummary(),
  ]);

  const maintenanceCount = maintenanceTools.filter(
    (t) => t.status === "maintenance"
  ).length;
  const retiredCount = maintenanceTools.filter(
    (t) => t.status === "retired"
  ).length;

  const recordsResult =
    tab === "records"
      ? await getAllMaintenanceRecords({
          q: params.q,
          maintenanceType: params.maintenanceType,
          page,
          pageSize: 25,
        })
      : null;

  const schedulesResult =
    tab === "schedules"
      ? await getAllSchedules({
          q: params.q,
          status: params.status,
          maintenanceType: params.maintenanceType,
          overdueOnly: params.overdue === "true",
          page,
          pageSize: 25,
        })
      : null;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Schedule, track, and assign tool maintenance tasks"
        actions={
          <div className="flex gap-2">
            <MaintenanceForm />
            <ScheduleForm />
          </div>
        }
      />

      {/* Combined Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<Wrench className="h-4 w-4 text-blue-500" />}
          label="Records"
          value={stats.totalRecords}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-green-500" />}
          label="Active Schedules"
          value={stats.activeSchedules}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Overdue"
          value={stats.overdueSchedules}
          color="red"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-green-500" />}
          label="Total Cost"
          value={`$${stats.totalCost.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          label="Pending Tasks"
          value={stats.pendingAssignments}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-purple-500" />}
          label="Total Schedules"
          value={stats.totalSchedules}
        />
      </div>

      {/* Tool status summary (from admin data) */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Wrench className="h-4 w-4 text-orange-500" />}
          label="In Maintenance"
          value={maintenanceCount}
          color="orange"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-slate-500" />}
          label="Retired"
          value={retiredCount}
          color="slate"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          label="Available"
          value={statusSummary.available}
          color="green"
        />
        <StatCard
          icon={<ArrowRightLeft className="h-4 w-4 text-blue-500" />}
          label="Checked Out"
          value={statusSummary.checkedOut}
          color="blue"
        />
      </div>

      {/* Overdue alerts */}
      {overdueSchedules.length > 0 && (
        <OverdueAlerts schedules={overdueSchedules} />
      )}

      {/* Tools Requiring Attention */}
      {maintenanceCount > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Tools Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maintenanceTools
              .filter((t) => t.status === "maintenance")
              .map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{tool.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {tool.brand} {tool.model}
                      </p>
                    </div>
                    <StatusBadge status={tool.status} />
                  </div>
                  <div className="mt-3 space-y-1">
                    {tool.assetId && (
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Asset:</span> {tool.assetId}
                      </p>
                    )}
                    {tool.locationName && (
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Location:</span>{" "}
                        {tool.locationName}
                      </p>
                    )}
                    {tool.categoryName && (
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Category:</span>{" "}
                        {tool.categoryName}
                      </p>
                    )}
                  </div>
                  {tool.conditionNotes && (
                    <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-700">
                      {tool.conditionNotes}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors">
                      Mark Available
                    </button>
                    <button className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded hover:bg-slate-200 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="Records" value="records" current={tab} />
        <TabLink label="Schedules" value="schedules" current={tab} />
      </div>

      {tab === "records" && recordsResult && (
        <MaintenanceTable
          mode="records"
          records={recordsResult.records}
          total={recordsResult.total}
          page={recordsResult.page}
          totalPages={recordsResult.totalPages}
        />
      )}

      {tab === "schedules" && schedulesResult && (
        <MaintenanceTable
          mode="schedules"
          schedules={schedulesResult.schedules}
          total={schedulesResult.total}
          page={schedulesResult.page}
          totalPages={schedulesResult.totalPages}
        />
      )}

      {/* All Maintenance/Retired Tools Table (asset-level view) */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            All Maintenance &amp; Retired Tools
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tool assets currently flagged as under maintenance or retired.
          </p>
        </div>
        {maintenanceTools.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Asset ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {maintenanceTools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {tool.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tool.brand} {tool.model}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-500">
                        {tool.assetId || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {tool.categoryName || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {tool.locationName || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={tool.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 line-clamp-2 max-w-xs">
                        {tool.conditionNotes || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(tool.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Edit
                        </button>
                        {tool.status === "maintenance" && (
                          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No tools in maintenance or retired" />
        )}
      </div>
    </div>
  );
}