import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAnalyticsOverview,
  getMostUsedTools,
  getLeastUsedTools,
  getMonthlyReservations,
  getCategoryUsage,
  getLocationUsage,
  getMaintenanceCostByType,
  getRepairAnalytics,
  getReplacementCandidates,
  getMemberAnalytics,
} from "@/lib/data/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  hint,
  color = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colors[color]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default async function AdminReportsPage() {
  await requireAdminAuth();

  const [
    overview,
    mostUsed,
    leastUsed,
    monthly,
    categoryUsage,
    locationUsage,
    maintenanceCosts,
    repairStats,
    replacementCandidates,
    memberStats,
  ] = await Promise.all([
    getAnalyticsOverview(),
    getMostUsedTools(10),
    getLeastUsedTools(10),
    getMonthlyReservations(12),
    getCategoryUsage(),
    getLocationUsage(),
    getMaintenanceCostByType(),
    getRepairAnalytics(),
    getReplacementCandidates(),
    getMemberAnalytics(),
  ]);

  const maxMonthly = Math.max(...monthly.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Insights into tool usage, costs, and member activity.
          </p>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tools"
          value={overview.totalTools}
          color="blue"
        />
        <StatCard
          label="Total Reservations"
          value={overview.totalReservations}
          hint={`${overview.avgReservationsPerTool.toFixed(1)} avg per tool`}
          color="green"
        />
        <StatCard
          label="Overdue Rate"
          value={formatPercent(overview.overdueRate)}
          color="red"
        />
        <StatCard
          label="Cancellation Rate"
          value={formatPercent(overview.cancellationRate)}
          color="orange"
        />
      </div>

      {/* Monthly reservation trend */}
      <SectionCard
        title="Reservations — Last 12 Months"
        description="Monthly reservation activity"
      >
        {monthly.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No reservation data yet.
          </p>
        ) : (
          <div className="space-y-2">
            {monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <div className="w-20 text-xs font-medium text-slate-600 tabular-nums">
                  {m.month}
                </div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-blue-500 flex items-center px-2 text-xs font-medium text-white"
                    style={{ width: `${(m.total / maxMonthly) * 100}%` }}
                  >
                    {m.total > 0 && m.total}
                  </div>
                </div>
                <div className="w-32 text-xs text-slate-500 text-right">
                  <span className="text-green-600">{m.completed} done</span>
                  {" • "}
                  <span className="text-red-600">{m.overdue} late</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Top and Bottom used tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Most Used Tools"
          description="Highest reservation count"
        >
          {mostUsed.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No data</p>
          ) : (
            <div className="space-y-2">
              {mostUsed.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-sm font-bold text-slate-400">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.categoryName ?? "Uncategorized"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {t.reservationCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Least Used Tools"
          description="Potential candidates for review"
        >
          {leastUsed.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No data</p>
          ) : (
            <div className="space-y-2">
              {leastUsed.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-sm font-bold text-slate-400">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.categoryName ?? "Uncategorized"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {t.reservationCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Category and Location usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Usage by Category"
          description="Reservations grouped by category"
        >
          {categoryUsage.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Tools</th>
                    <th className="text-right py-2">Total Res.</th>
                    <th className="text-right py-2">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryUsage.map((c) => (
                    <tr key={c.categoryName}>
                      <td className="py-2 text-slate-900">{c.categoryName}</td>
                      <td className="text-right text-slate-600">{c.toolCount}</td>
                      <td className="text-right text-slate-600">{c.totalReservations}</td>
                      <td className="text-right text-blue-600 font-medium">
                        {c.activeReservations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Usage by Location"
          description="Reservations grouped by location"
        >
          {locationUsage.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">Location</th>
                    <th className="text-right py-2">Tools</th>
                    <th className="text-right py-2">Reservations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locationUsage.map((l) => (
                    <tr key={l.locationName}>
                      <td className="py-2 text-slate-900">{l.locationName}</td>
                      <td className="text-right text-slate-600">{l.toolCount}</td>
                      <td className="text-right text-blue-600 font-medium">
                        {l.totalReservations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Maintenance and repair costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Maintenance Costs by Type"
          description="Total spend by maintenance activity"
        >
          {maintenanceCosts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No maintenance records
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Records</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenanceCosts.map((m) => (
                    <tr key={m.maintenanceType}>
                      <td className="py-2 text-slate-900 capitalize">
                        {m.maintenanceType.replace("_", " ")}
                      </td>
                      <td className="text-right text-slate-600">{m.recordCount}</td>
                      <td className="text-right text-slate-900 font-medium">
                        {formatCurrency(m.totalCost)}
                      </td>
                      <td className="text-right text-slate-500">
                        {formatCurrency(m.avgCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Repair Statistics" description="Overall repair performance">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Total Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {repairStats.totalRepairs}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {repairStats.completedRepairs}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700">Unrepairable</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {repairStats.unrepairableCount}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">Avg Cost</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(repairStats.avgRepairCost)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg col-span-2">
              <p className="text-xs text-purple-700">Avg Days to Complete</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {repairStats.avgDaysToComplete.toFixed(1)} days
              </p>
            </div>
          </div>

          {repairStats.topRepairTools.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Most Repaired Tools
              </p>
              <div className="space-y-1">
                {repairStats.topRepairTools.slice(0, 5).map((t) => (
                  <div
                    key={t.toolName}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50"
                  >
                    <span className="text-slate-700 truncate">{t.toolName}</span>
                    <span className="text-red-600 font-medium">
                      {t.repairCount}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Replacement candidates */}
      <SectionCard
        title="Replacement Candidates"
        description="Tools where accumulated costs may justify replacement"
      >
        {replacementCandidates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No replacement candidates identified 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="text-left py-2">Tool</th>
                  <th className="text-right py-2">Replacement</th>
                  <th className="text-right py-2">Total Cost</th>
                  <th className="text-right py-2">Cost Ratio</th>
                  <th className="text-left py-2 pl-4">Reason</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {replacementCandidates.slice(0, 15).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.assetId ?? "No asset ID"}
                      </p>
                    </td>
                    <td className="text-right text-slate-700">
                      {formatCurrency(c.replacementCost)}
                    </td>
                    <td className="text-right text-slate-900 font-medium">
                      {formatCurrency(c.totalCost)}
                    </td>
                    <td className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.costRatio >= 0.75
                            ? "bg-red-100 text-red-700"
                            : c.costRatio >= 0.5
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatPercent(c.costRatio * 100)}
                      </span>
                    </td>
                    <td className="pl-4 py-2 text-xs text-slate-600">
                      {c.reason}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/tools/${c.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Member analytics */}
      <SectionCard
        title="Member Activity"
        description="Membership overview and top borrowers"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">Total Members</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {memberStats.totalMembers}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700">Active Members</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {memberStats.activeMembers}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700">New This Month</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {memberStats.newMembersThisMonth}
            </p>
          </div>
        </div>

        {memberStats.topBorrowers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Top Borrowers
            </p>
            <div className="space-y-1">
              {memberStats.topBorrowers.map((b, i) => (
                <div
                  key={b.email}
                  className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-sm font-bold text-slate-400">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-slate-900 truncate">{b.userName}</p>
                      <p className="text-xs text-slate-500 truncate">{b.email}</p>
                    </div>
                  </div>
                  <span className="text-blue-600 font-medium">
                    {b.reservationCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}