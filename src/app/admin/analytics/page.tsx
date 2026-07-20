import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getMostUsedTools,
  getLeastUsedTools,
  getMonthlyReservations,
  getCategoryUsage,
  getLocationUsage,
  getMaintenanceCostByType,
  getRepairAnalytics,
  getReplacementCandidates,
  getMemberAnalytics,
  getAnalyticsOverview,
} from "@/lib/data/analytics";
import { PageHeader } from "@/components/admin/page-header";
import {
  BarChart3,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Percent,
} from "lucide-react";
import { UsageAnalytics } from "./components/usage-analytics";
import { MaintenanceAnalyticsView } from "./components/maintenance-analytics";
import { ReplacementCandidatesView } from "./components/replacement-candidates";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const metadata = {
  title: "Analytics | Admin",
  description: "Tool usage, revenue, and maintenance analytics",
};

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "usage";

  const overview = await getAnalyticsOverview();

  const usageData =
    tab === "usage"
      ? await Promise.all([
          getMostUsedTools(20),
          getLeastUsedTools(20),
          getMonthlyReservations(12),
          getCategoryUsage(),
          getLocationUsage(),
          getMemberAnalytics(),
        ])
      : null;

  const maintenanceData =
    tab === "maintenance"
      ? await Promise.all([
          getMaintenanceCostByType(),
          getRepairAnalytics(),
        ])
      : null;

  const replacementData =
    tab === "replacement"
      ? await getReplacementCandidates()
      : null;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights into tool usage, costs, and performance"
      />

      {/* Overview KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <KpiCard icon={<Package className="h-4 w-4 text-blue-500" />} label="Tools" value={String(overview.totalTools)} />
        <KpiCard icon={<BarChart3 className="h-4 w-4 text-green-500" />} label="Reservations" value={String(overview.totalReservations)} />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-purple-500" />} label="Avg Res/Tool" value={overview.avgReservationsPerTool.toFixed(1)} />
        <KpiCard icon={<Wrench className="h-4 w-4 text-orange-500" />} label="Maintenance" value={String(overview.totalMaintenanceRecords)} />
        <KpiCard icon={<Wrench className="h-4 w-4 text-red-500" />} label="Repairs" value={String(overview.totalRepairs)} />
        <KpiCard icon={<Percent className="h-4 w-4 text-yellow-500" />} label="Overdue Rate" value={`${overview.overdueRate.toFixed(1)}%`} color={overview.overdueRate > 10 ? "red" : "green"} />
        <KpiCard icon={<Percent className="h-4 w-4 text-slate-500" />} label="Cancel Rate" value={`${overview.cancellationRate.toFixed(1)}%`} color={overview.cancellationRate > 20 ? "red" : "green"} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="Usage" value="usage" current={tab} />
        <TabLink label="Maintenance & Repairs" value="maintenance" current={tab} />
        <TabLink label="Replacement Candidates" value="replacement" current={tab} />
      </div>

      {/* Usage tab */}
      {tab === "usage" && usageData && (
        <UsageAnalytics
          mostUsed={usageData[0]}
          leastUsed={usageData[1]}
          monthlyReservations={usageData[2]}
          categoryUsage={usageData[3]}
          locationUsage={usageData[4]}
          memberAnalytics={usageData[5]}
        />
      )}

      {/* Maintenance tab */}
      {tab === "maintenance" && maintenanceData && (
        <MaintenanceAnalyticsView
          costByType={maintenanceData[0]}
          repairAnalytics={maintenanceData[1]}
        />
      )}

      {/* Replacement tab */}
      {tab === "replacement" && replacementData && (
        <ReplacementCandidatesView candidates={replacementData} />
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  const vc =
    color === "red"
      ? "text-red-600"
      : color === "green"
        ? "text-green-600"
        : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-0.5 text-xl font-bold ${vc}`}>{value}</p>
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
      href={`/admin/analytics?tab=${value}`}
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