import { requireAdminAuth } from "@/lib/admin-auth";
import { getUpcomingReservations } from "@/lib/data/admin";
import {
  getReservationsList,
  getReservationStats,
  getReservationFilterLocations,
  getCalendarEvents,
} from "@/lib/data/reservations";
import { PageHeader } from "@/components/admin/page-header";
import { ReservationsTable } from "./components/reservations-table";
import { ReservationCalendar } from "./components/reservation-calendar";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
} from "lucide-react";

export const metadata = {
  title: "Reservations | Admin",
  description: "Manage tool reservations",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    locationId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    view?: string;
    calMonth?: string;
    // legacy search compat
    search?: string;
    dateRange?: string;
  }>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_out: "bg-green-100 text-green-800",
    returned: "bg-slate-100 text-slate-800",
    cancelled: "bg-red-100 text-red-800",
    overdue: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
        styles[status] ?? "bg-slate-100 text-slate-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  const valueColor =
    color === "yellow"
      ? "text-yellow-600"
      : color === "blue"
        ? "text-blue-600"
        : color === "purple"
          ? "text-purple-600"
          : color === "green"
            ? "text-green-600"
            : color === "red"
              ? "text-red-600"
              : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-0.5 text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function ViewTab({
  label,
  value,
  current,
  searchQuery,
  statusFilter,
}: {
  label: string;
  value: string;
  current: string;
  searchQuery: string;
  statusFilter: string;
}) {
  const isActive = current === value;
  const href =
    `/admin/reservations?view=${value}` +
    (statusFilter !== "all" ? `&status=${statusFilter}` : "") +
    (searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "");

  return (
    <a
      href={href}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminReservationsPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;

  // Normalise params — support both `q` and legacy `search`
  const searchQuery = params.q ?? params.search ?? "";
  const statusFilter = params.status ?? "all";
  const view = params.view ?? "list";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const dateRange = (params.dateRange ?? "all") as "upcoming" | "past" | "all";

  // ── Fetch in parallel ───────────────────────────────────────────────────────
  const [stats, filterLocations, upcomingReservations] = await Promise.all([
    getReservationStats(),
    getReservationFilterLocations(),
    getUpcomingReservations(6),
  ]);

  // List view data
  const listResult =
    view === "list"
      ? await getReservationsList({
          q: searchQuery || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          locationId: params.locationId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page,
          pageSize: 25,
        })
      : null;

  // Calendar view data
  let calendarEvents: Awaited<ReturnType<typeof getCalendarEvents>> = [];
  if (view === "calendar") {
    const now = new Date();
    const calMonthStr = params.calMonth;
    let year = now.getFullYear();
    let month = now.getMonth();
    if (calMonthStr) {
      const parts = calMonthStr.split("-");
      if (parts.length === 2) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
      }
    }
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    calendarEvents = await getCalendarEvents(startDate, endDate);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title="Reservations"
          description="Manage tool reservations, approvals, and returns"
        />
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Reservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard
          icon={<Package className="h-4 w-4 text-slate-500" />}
          label="Total"
          value={stats.total}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          label="Pending"
          value={stats.pending}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-blue-500" />}
          label="Confirmed"
          value={stats.confirmed}
          color="blue"
        />
        <StatCard
          icon={<Package className="h-4 w-4 text-purple-500" />}
          label="Checked Out"
          value={stats.checkedOut}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          label="Returned"
          value={stats.returned}
          color="green"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-slate-400" />}
          label="Cancelled"
          value={stats.cancelled}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Overdue"
          value={stats.overdue}
          color="red"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All", value: stats.total },
          { key: "pending", label: "Pending", value: stats.pending },
          { key: "confirmed", label: "Confirmed", value: stats.confirmed },
          { key: "checked_out", label: "Checked Out", value: stats.checkedOut },
          { key: "returned", label: "Returned", value: stats.returned },
          { key: "overdue", label: "Overdue", value: stats.overdue },
          { key: "cancelled", label: "Cancelled", value: stats.cancelled },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={
              `/admin/reservations?status=${tab.key}&view=${view}` +
              (searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "")
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label} ({tab.value})
          </Link>
        ))}
      </div>

      {/* Upcoming reservations preview — only on unfiltered list view */}
      {upcomingReservations.length > 0 &&
        statusFilter === "all" &&
        !searchQuery &&
        view === "list" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Upcoming Reservations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{res.toolName}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {res.memberName ?? res.memberEmail}
                      </p>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>📅 {res.pickupDate}</span>
                    <span>→ {res.returnDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* View toggle */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <ViewTab
          label="List"
          value="list"
          current={view}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
        <ViewTab
          label="Calendar"
          value="calendar"
          current={view}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>

      {/* List view */}
      {view === "list" && (
        <>
          {/* Search / filter bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <form className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search by tool, customer, reservation ID…"
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input type="hidden" name="status" value={statusFilter} />
              <input type="hidden" name="view" value="list" />
              <select
                name="dateRange"
                defaultValue={dateRange}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <Link
                href="/admin/reservations"
                className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900"
              >
                Clear
              </Link>
            </form>
          </div>

          {/* Table */}
          {listResult && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {listResult.reservations.length > 0 ? (
                <ReservationsTable
                  reservations={listResult.reservations}
                  total={listResult.total}
                  page={listResult.page}
                  totalPages={listResult.totalPages}
                  filterLocations={filterLocations}
                />
              ) : (
                <EmptyState message="No reservations found matching your filters" />
              )}
            </div>
          )}
        </>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <ReservationCalendar
          events={calendarEvents}
          currentMonth={params.calMonth}
        />
      )}
    </div>
  );
}