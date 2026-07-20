import { requireAdminAuth, getRoleDisplayName, getAdminAccessSource, getAdminPermissions, getImpersonationInfo } from "@/lib/admin-auth";
import { getAllCustomers } from "@/lib/data/admin";
import { type Permission } from "@/lib/permissions";
import ImpersonationForm from "./ImpersonationForm";

export const metadata = {
  title: "Settings | Admin Portal",
  description: "Admin settings and permissions",
};

const permissionDescriptions: Record<Permission, { title: string; description: string; icon: string }> = {
  "dashboard:view": { title: "View Dashboard", description: "Access the dashboard", icon: "🏠" },
  "members:view": { title: "View Members", description: "View member accounts", icon: "👥" },
  "members:create": { title: "Create Members", description: "Create new member accounts", icon: "➕" },
  "members:edit": { title: "Edit Members", description: "Edit member accounts", icon: "✏️" },
  "members:delete": { title: "Delete Members", description: "Delete member accounts", icon: "🗑️" },
  "tools:view": { title: "View Tools", description: "Browse available tools", icon: "👀" },
  "tools:create": { title: "Create Tools", description: "Add new tools to inventory", icon: "🔧" },
  "tools:edit": { title: "Edit Tools", description: "Edit tool details", icon: "✏️" },
  "tools:delete": { title: "Delete Tools", description: "Remove tools from inventory", icon: "🗑️" },
  "categories:view": { title: "View Categories", description: "View tool categories", icon: "📂" },
  "categories:manage": { title: "Manage Categories", description: "Create and edit categories", icon: "📁" },
  "reservations:view_own": { title: "View Own Reservations", description: "View your own reservations", icon: "📅" },
  "reservations:view_all": { title: "View All Reservations", description: "View all reservations", icon: "📋" },
  "reservations:create": { title: "Create Reservations", description: "Make new reservations", icon: "✅" },
  "reservations:manage": { title: "Manage Reservations", description: "Modify and cancel reservations", icon: "🗓️" },
  "maintenance:view": { title: "View Maintenance", description: "View maintenance records", icon: "🔍" },
  "maintenance:manage": { title: "Manage Maintenance", description: "Create and update maintenance records", icon: "🛠️" },
  "locations:view": { title: "View Locations", description: "View location details", icon: "📍" },
  "locations:manage": { title: "Manage Locations", description: "Add and edit locations", icon: "🗺️" },
  "users:view": { title: "View Users", description: "View user accounts", icon: "👤" },
  "users:manage": { title: "Manage Users", description: "Create and edit user accounts", icon: "👥" },
  "users:assign_roles": { title: "Assign Roles", description: "Change user roles", icon: "🎭" },
  "users:impersonate": { title: "Impersonate Users", description: "View app as another user", icon: "🔐" },
  "settings:view": { title: "View Settings", description: "View admin settings", icon: "⚙️" },
  "settings:manage": { title: "Manage Settings", description: "Change admin settings", icon: "🔩" },
  "reports:view": { title: "View Reports", description: "Access analytics and reports", icon: "📊" },
};

export default async function SettingsPage() {
  const user = await requireAdminAuth();
  const roleDisplayName = getRoleDisplayName(user.role);
  const accessSource = getAdminAccessSource(user.email, user.role);
  const permissions = getAdminPermissions(user.role);
  const impersonation = await getImpersonationInfo();

  // Get members for impersonation dropdown
  const members = await getAllCustomers({ role: "member", limit: 50 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your admin identity and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Identity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Identity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900">{user.name || "No name set"}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">User ID</span>
                <span className="text-sm font-mono text-slate-700">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Role</span>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {roleDisplayName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Raw Role Value</span>
                <span className="text-sm font-mono text-slate-700">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Source */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Access Source</h2>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Access Granted Via</p>
                <p className="mt-1 text-sm text-slate-600 font-mono bg-white px-2 py-1 rounded border border-slate-200">
                  {accessSource}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Admin access is determined by:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-500">
              <li>
                <code className="px-1 bg-slate-100 rounded">users.role</code> column (super_admin, admin, manager, employee)
              </li>
              <li>
                <code className="px-1 bg-slate-100 rounded">ADMIN_EMAILS</code> environment variable fallback
              </li>
            </ol>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Permissions</h2>
          <p className="text-sm text-slate-500 mb-4">
            Based on your role ({roleDisplayName}), you have the following permissions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(permissionDescriptions).map(([key, info]) => {
              const hasPermission = permissions.includes(key as Permission);
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border ${
                    hasPermission
                      ? "bg-green-50 border-green-200"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{info.title}</p>
                        {hasPermission ? (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impersonation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer View (Impersonation)</h2>
          <p className="text-sm text-slate-500 mb-4">
            View the application as a specific customer to troubleshoot issues or verify their experience.
            This does not modify any data or grant the customer additional permissions.
          </p>

          {impersonation.isImpersonating && impersonation.impersonatedUser ? (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Currently Impersonating</p>
                    <p className="text-sm text-amber-700">
                      {impersonation.impersonatedUser.name || impersonation.impersonatedUser.email}
                      {" "}({impersonation.impersonatedUser.role})
                    </p>
                  </div>
                </div>
                <ImpersonationForm action="stop" />
              </div>
            </div>
          ) : (
            <ImpersonationForm action="start" members={members} />
          )}

          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Impersonation sets a secure HTTP-only cookie</li>
              <li>Your admin session remains intact</li>
              <li>You can stop impersonating at any time</li>
              <li>Cannot impersonate other admin users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}