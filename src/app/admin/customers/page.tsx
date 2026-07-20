import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllCustomers } from "@/lib/data/admin";
import Link from "next/link";

export const metadata = {
  title: "Customers | Admin Portal",
  description: "Manage customers and members",
};

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    manager: "bg-indigo-100 text-indigo-800",
    employee: "bg-teal-100 text-teal-800",
    member: "bg-slate-100 text-slate-800",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[role] || "bg-slate-100 text-slate-800"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-slate-300"}`}
      title={isActive ? "Active" : "Inactive"}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string }>;
}) {
  await requireAdminAuth();
  const params = await searchParams;
  
  const roleFilter = params.role || "all";
  const searchQuery = params.search || "";

  const customers = await getAllCustomers({ role: roleFilter, search: searchQuery });

  // Count by role
  const allCustomers = await getAllCustomers({ limit: 1000 });
  const roleCounts = {
    all: allCustomers.length,
    member: allCustomers.filter(c => c.role === "member").length,
    employee: allCustomers.filter(c => c.role === "employee").length,
    manager: allCustomers.filter(c => c.role === "manager").length,
    admin: allCustomers.filter(c => c.role === "admin").length,
    super_admin: allCustomers.filter(c => c.role === "super_admin").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage members and user accounts ({roleCounts.all} total)
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Users", count: roleCounts.all },
          { key: "member", label: "Members", count: roleCounts.member },
          { key: "employee", label: "Employees", count: roleCounts.employee },
          { key: "manager", label: "Managers", count: roleCounts.manager },
          { key: "admin", label: "Admins", count: roleCounts.admin + roleCounts.super_admin },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/customers?role=${tab.key}${searchQuery ? `&search=${searchQuery}` : ""}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              roleFilter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search by name, email, member number..."
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input type="hidden" name="role" value={roleFilter} />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <Link
            href="/admin/customers"
            className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900"
          >
            Clear
          </Link>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reservations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {customer.name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{customer.name || "—"}</span>
                            <StatusDot isActive={customer.isActive} />
                          </div>
                          <div className="text-xs text-slate-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-500">{customer.memberNumber || "—"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={customer.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.membershipStatus ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          customer.membershipStatus === "active" ? "bg-green-100 text-green-800" :
                          customer.membershipStatus === "expired" ? "bg-red-100 text-red-800" :
                          customer.membershipStatus === "suspended" ? "bg-orange-100 text-orange-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {customer.membershipStatus}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{customer.reservationCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View
                        </button>
                        <button className="text-sm text-slate-600 hover:text-slate-700 font-medium">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No customers found matching your filters" />
        )}
      </div>
    </div>
  );
}
