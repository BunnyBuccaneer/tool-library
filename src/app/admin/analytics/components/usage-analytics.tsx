import type {
  ToolUsageRecord,
  MonthlyReservation,
  CategoryUsageRecord,
  LocationUsageRecord,
  MemberAnalytics,
} from "@/lib/data/analytics";
import { AnalyticsCard, Metric, HorizontalBar } from "./analytics-card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { toolStatusBadge } from "@/components/admin/status-badge";
import { format, parse } from "date-fns";

interface UsageAnalyticsProps {
  mostUsed: ToolUsageRecord[];
  leastUsed: ToolUsageRecord[];
  monthlyReservations: MonthlyReservation[];
  categoryUsage: CategoryUsageRecord[];
  locationUsage: LocationUsageRecord[];
  memberAnalytics: MemberAnalytics;
}

export function UsageAnalytics({
  mostUsed,
  leastUsed,
  monthlyReservations,
  categoryUsage,
  locationUsage,
  memberAnalytics,
}: UsageAnalyticsProps) {
  const maxRes = Math.max(...mostUsed.map((t) => t.reservationCount), 1);
  const maxCatRes = Math.max(...categoryUsage.map((c) => c.totalReservations), 1);
  const maxLocRes = Math.max(...locationUsage.map((l) => l.totalReservations), 1);
  const maxBorrower = Math.max(...memberAnalytics.topBorrowers.map((b) => b.reservationCount), 1);
  const maxMonthly = Math.max(...monthlyReservations.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Monthly reservation trend */}
      <AnalyticsCard title="Reservation Trend" subtitle="Monthly reservation volume over 12 months">
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-end gap-2" style={{ minWidth: `${monthlyReservations.length * 55}px`, height: "160px" }}>
            {monthlyReservations.map((m) => {
              const height = maxMonthly > 0 ? (m.total / maxMonthly) * 140 : 0;
              const monthLabel = format(parse(m.month, "yyyy-MM", new Date()), "MMM");
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-500">{m.total}</span>
                  <div className="w-full rounded-t-sm bg-blue-400" style={{ height: `${Math.max(height, 2)}px` }} />
                  <span className="text-xs text-slate-500">{monthLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Metric label="Avg/Month" value={(monthlyReservations.reduce((s, m) => s + m.total, 0) / Math.max(monthlyReservations.length, 1)).toFixed(1)} />
          <Metric label="Total Completed" value={monthlyReservations.reduce((s, m) => s + m.completed, 0)} color="green" />
          <Metric label="Total Cancelled" value={monthlyReservations.reduce((s, m) => s + m.cancelled, 0)} color="red" />
          <Metric label="Total Overdue" value={monthlyReservations.reduce((s, m) => s + m.overdue, 0)} color="yellow" />
        </div>
      </AnalyticsCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most used */}
        <AnalyticsCard title="Most Used Tools" subtitle="Top 10 by reservation count">
          <div className="space-y-2">
            {mostUsed.slice(0, 10).map((t) => (
              <HorizontalBar key={t.id} label={t.name} value={t.reservationCount} maxValue={maxRes} color="bg-blue-500" />
            ))}
            {mostUsed.length === 0 && <p className="text-sm text-slate-400">No usage data yet.</p>}
          </div>
        </AnalyticsCard>

        {/* Least used */}
        <AnalyticsCard title="Least Used Tools" subtitle="Bottom 10 by reservation count">
          <div className="space-y-2">
            {leastUsed.slice(0, 10).map((t) => (
              <HorizontalBar key={t.id} label={t.name} value={t.reservationCount} maxValue={maxRes} color="bg-slate-300" />
            ))}
            {leastUsed.length === 0 && <p className="text-sm text-slate-400">No usage data yet.</p>}
          </div>
        </AnalyticsCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category usage */}
        <AnalyticsCard title="Usage by Category">
          <div className="space-y-2">
            {categoryUsage.slice(0, 10).map((c) => (
              <HorizontalBar key={c.categoryName} label={c.categoryName} value={c.totalReservations} maxValue={maxCatRes} color="bg-purple-400" />
            ))}
          </div>
        </AnalyticsCard>

        {/* Location usage */}
        <AnalyticsCard title="Usage by Location">
          <div className="space-y-2">
            {locationUsage.slice(0, 10).map((l) => (
              <HorizontalBar key={l.locationName} label={l.locationName} value={l.totalReservations} maxValue={maxLocRes} color="bg-teal-400" />
            ))}
          </div>
        </AnalyticsCard>

        {/* Top borrowers */}
        <AnalyticsCard title="Top Borrowers">
          <div className="mb-4 flex gap-4">
            <Metric label="Total Members" value={memberAnalytics.totalMembers} />
            <Metric label="Active" value={memberAnalytics.activeMembers} color="green" />
            <Metric label="New (Month)" value={memberAnalytics.newMembersThisMonth} color="blue" />
          </div>
          <div className="space-y-2">
            {memberAnalytics.topBorrowers.slice(0, 8).map((b, idx) => (
              <HorizontalBar key={idx} label={b.userName} value={b.reservationCount} maxValue={maxBorrower} color="bg-orange-400" />
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}