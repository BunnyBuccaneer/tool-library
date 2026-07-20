import { requireAdminAuth } from "@/lib/admin-auth";
import { getCurrentRentals, getOverdueTools, getTodaysReturns, getAllRentals } from "@/lib/data/admin";
import Link from "next/link";

export const metadata = {
  title: "Rentals | Admin Portal",
  description: "Manage tool rentals",
};

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
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-slate-100 text-slate-800"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdminAuth();
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const searchQuery = params.search || "";

  const [currentRentals, overdueTools, todaysReturns, allRentals] = await Promise.all([
    getCurrentRentals(50),
    getOverdueTools(50),
    getTodaysReturns(),
    getAllRentals({ status: statusFilter, search: searchQuery, limit: 100 }),
  ]);

  const overdueCount = overdueTools.length;
  const todaysReturnsCount = todaysReturns.length;
  const activeCount = currentRentals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rentals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage active rentals, returns, and overdue items
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Rentals</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Due Today</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{todaysReturnsCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert Section */}
      {overdueTools.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800">Overdue Items Require Attention</h3>
              <p className="mt-1 text-sm text-red-700">{overdueCount} item{overdueCount !== 1 ? "s" : ""} past return date</p>
              <div className="mt-4 space-y-2">
                {overdueTools.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                    <div>
                      <p className="font-medium text-slate-900">{item.toolName}</p>
                      <p className="text-sm text-slate-500">{item.memberName || item.memberEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{item.daysOverdue} day{item.daysOverdue !== 1 ? "s" : ""} overdue</p>
                      <p className="text-xs text-slate-500">Due: {item.returnDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Returns */}
      {todaysReturns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Expected Returns Today</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysReturns.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="font-medium text-slate-900">{item.toolName}</p>
                <p className="text-sm text-slate-500 mt-1">{item.memberName || item.memberEmail}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">{item.returnTime || "Any time"}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search by tool, customer..."
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_out">Checked Out</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          <Link
            href="/admin/rentals"
            className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900"
          >
            Clear
          </Link>
        </form>
      </div>

      {/* All Rentals Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">All Rentals</h2>
        </div>
        {allRentals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pickup</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{rental.toolName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{rental.memberName || "—"}</div>
                      <div className="text-xs text-slate-500">{rental.memberEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {rental.locationName || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {rental.pickupDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {rental.returnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={rental.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No rentals found" />
        )}
      </div>
    </div>
  );
}
