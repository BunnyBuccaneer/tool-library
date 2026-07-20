import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getPermissionsForRole, type Role } from "@/lib/permissions";
import {
  getDashboardKPIs,
  getCurrentRentals,
  getOverdueTools,
  getTodaysReturns,
  getMaintenanceTools,
  getUpcomingReservations,
  getRecentNotifications,
  getToolStatusSummary,
  getRecentMembers,
} from "@/lib/data/admin";

// ── Sub-components ─────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses: Record<typeof color, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  badge,
}: {
  title: string;
  action?: { label: string; href: string };
  badge?: { label: string; className: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {badge && (
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}
        >
          {badge.label}
        </span>
      )}
      {action && (
        <Link
          href={action.href}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_out: "bg-green-100 text-green-800",
    returned: "bg-slate-100 text-slate-800",
    cancelled: "bg-red-100 text-red-800",
    overdue: "bg-red-100 text-red-800",
    available: "bg-green-100 text-green-800",
    maintenance: "bg-orange-100 text-orange-800",
    retired: "bg-slate-100 text-slate-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
        statusStyles[status] ?? "bg-slate-100 text-slate-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <svg
        className="w-12 h-12 text-slate-300 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const user = await requireAdminAuth();
  const role = user.role as Role;
  const permissions = getPermissionsForRole(role);

  const [
    kpis,
    currentRentals,
    overdueTools,
    todaysReturns,
    maintenanceTools,
    upcomingReservations,
    recentNotifications,
    toolStatusSummary,
  ] = await Promise.all([
    getDashboardKPIs(),
    getCurrentRentals(5),
    getOverdueTools(5),
    getTodaysReturns(),
    getMaintenanceTools(5),
    getUpcomingReservations(5),
    getRecentNotifications(5),
    getToolStatusSummary(),
    getRecentMembers(5),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {user.name ?? user.email}. Here&apos;s what&apos;s
          happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tools"
          value={kpis.totalTools}
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />
        <KPICard
          title="Total Members"
          value={kpis.totalMembers}
          color="green"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <KPICard
          title="Active Reservations"
          value={kpis.activeReservations}
          color="orange"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <KPICard
          title="Active Locations"
          value={kpis.totalLocations}
          color="purple"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Tool Status Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <SectionHeader title="Tool Status Overview" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">
              {toolStatusSummary.available}
            </p>
            <p className="text-sm text-green-600">Available</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {toolStatusSummary.checkedOut}
            </p>
            <p className="text-sm text-blue-600">Checked Out</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">
              {toolStatusSummary.reserved}
            </p>
            <p className="text-sm text-purple-600">Reserved</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-700">
              {toolStatusSummary.maintenance}
            </p>
            <p className="text-sm text-orange-600">Maintenance</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-700">
              {toolStatusSummary.retired}
            </p>
            <p className="text-sm text-slate-600">Retired</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Rentals */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            title="Current Rentals"
            action={{
              label: "View all",
              href: "/admin/reservations?status=checked_out",
            }}
          />
          {currentRentals.length > 0 ? (
            <div className="space-y-3">
              {currentRentals.map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {rental.toolName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {rental.memberName ?? rental.memberEmail}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-slate-500">
                      Due: {rental.returnDate}
                    </p>
                    <StatusBadge status={rental.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No active rentals" />
          )}
        </div>

        {/* Overdue Tools */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            title="Overdue Tools"
            badge={{
              label: `${overdueTools.length} overdue`,
              className:
                overdueTools.length > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700",
            }}
          />
          {overdueTools.length > 0 ? (
            <div className="space-y-3">
              {overdueTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {tool.toolName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {tool.memberName ?? tool.memberEmail}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-red-600">
                      {tool.daysOverdue} day{tool.daysOverdue !== 1 ? "s" : ""}{" "}
                      overdue
                    </p>
                    <p className="text-xs text-slate-500">
                      Due: {tool.returnDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No overdue tools 🎉" />
          )}
        </div>

        {/* Today's Returns */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            title="Today's Returns"
            badge={{
              label: `${todaysReturns.length} expected`,
              className: "bg-blue-100 text-blue-700",
            }}
          />
          {todaysReturns.length > 0 ? (
            <div className="space-y-3">
              {todaysReturns.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {item.toolName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {item.memberName ?? item.memberEmail}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-slate-500">
                      {item.returnTime ?? "Any time"}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No returns scheduled for today" />
          )}
        </div>

        {/* Tools in Maintenance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            title="Tools in Maintenance"
            action={{
              label: "View all",
              href: "/admin/tools?status=maintenance",
            }}
          />
          {maintenanceTools.length > 0 ? (
            <div className="space-y-3">
              {maintenanceTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {tool.name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {tool.assetId ? `#${tool.assetId}` : "No Asset ID"}
                      {tool.locationName && ` • ${tool.locationName}`}
                    </p>
                  </div>
                  <div className="ml-4">
                    <StatusBadge status={tool.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No tools in maintenance" />
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Reservations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            title="Upcoming Reservations"
            action={{ label: "View all", href: "/admin/reservations" }}
          />
          {upcomingReservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    {["Tool", "Member", "Pickup", "Return", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingReservations.map((res) => (
                    <tr key={res.id}>
                      <td className="py-3 text-sm text-slate-900">
                        {res.toolName}
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {res.memberName ?? res.memberEmail}
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {res.pickupDate}
                        {res.pickupTime && ` @ ${res.pickupTime}`}
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {res.returnDate}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={res.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No upcoming reservations" />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-2">
              {[
                {
                  href: "/admin/tools/new",
                  label: "Add New Tool",
                  color: "bg-blue-100 text-blue-600",
                  path: "M12 4v16m8-8H4",
                },
                {
                  href: "/admin/reservations/new",
                  label: "New Reservation",
                  color: "bg-green-100 text-green-600",
                  path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
                {
                  href: "/admin/customers",
                  label: "Manage Customers",
                  color: "bg-purple-100 text-purple-600",
                  path: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                },
                {
                  href: "/admin/reports",
                  label: "Generate Report",
                  color: "bg-orange-100 text-orange-600",
                  path: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                },
                {
                  href: "/admin/settings",
                  label: "Settings",
                  color: "bg-slate-100 text-slate-600",
                  path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                },
              ].map(({ href, label, color, path }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={path}
                      />
                    </svg>
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Your Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <SectionHeader title="Your Permissions" />
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <svg
                    className="w-4 h-4 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {permission.replace(/_/g, " ").replace(/:/g, ": ")}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <SectionHeader title="Recent Notifications" />
        {recentNotifications.length > 0 ? (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  notification.isRead
                    ? "bg-slate-50"
                    : "bg-blue-50 border border-blue-100"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    notification.isRead ? "bg-slate-300" : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {notification.userName && `${notification.userName} • `}
                    {notification.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  {notification.type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No recent notifications" />
        )}
      </div>
    </div>
  );
}