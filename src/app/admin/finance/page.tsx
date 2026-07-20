import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getFinancialSummary,
  getMonthlyCosts,
  getToolFinancials,
  getCategoryFinancials,
} from "@/lib/data/finance";
import { PageHeader } from "@/components/admin/page-header";
import { DollarSign, TrendingUp, TrendingDown, Wrench, AlertTriangle } from "lucide-react";
import { RevenueSummary } from "./components/revenue-summary";
import { CostBreakdown } from "./components/cost-breakdown";
import { ToolProfitability } from "./components/tool-profitability";
import { CsvExportButton } from "./components/csv-export";

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    tab?: string;
  }>;
}

export const metadata = {
  title: "Finance | Admin",
  description: "Financial dashboard and cost tracking",
};

export default async function AdminFinancePage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "overview";

  const [summary, monthlyCosts, toolFinancials, categoryFinancials] =
    await Promise.all([
      getFinancialSummary({ dateFrom: params.dateFrom, dateTo: params.dateTo }),
      getMonthlyCosts(12),
      getToolFinancials(),
      getCategoryFinancials(),
    ]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        description="Revenue, costs, and net position across your tool library"
        actions={<CsvExportButton />}
      />

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          label="Replacement Value"
          value={`$${fmt(summary.totalReplacementValue)}`}
        />
        <KpiCard
          icon={<Wrench className="h-5 w-5 text-orange-500" />}
          label="Maintenance Cost"
          value={`$${fmt(summary.totalMaintenanceCost)}`}
          color="orange"
        />
        <KpiCard
          icon={<Wrench className="h-5 w-5 text-red-500" />}
          label="Repair Cost"
          value={`$${fmt(summary.totalRepairCost)}`}
          color="red"
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-purple-500" />}
          label="Parts Cost"
          value={`$${fmt(summary.totalPartsCost)}`}
          color="purple"
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-yellow-500" />}
          label="Total Costs"
          value={`$${fmt(summary.totalCombinedCost)}`}
          color="yellow"
        />
        <KpiCard
          icon={
            summary.netPosition >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )
          }
          label="Net Position"
          value={`$${fmt(summary.netPosition)}`}
          color={summary.netPosition >= 0 ? "green" : "red"}
        />
      </div>

      {/* Tool fleet summary bar */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white px-6 py-3">
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{summary.activeToolCount}</span> active tools
        </span>
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-orange-600">{summary.toolsInMaintenance}</span> in maintenance
        </span>
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-slate-400">{summary.toolsRetired}</span> retired
        </span>
        {summary.totalVendorCost > 0 && (
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-teal-600">${fmt(summary.totalVendorCost)}</span> vendor costs
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="Overview" value="overview" current={tab} />
        <TabLink label="By Tool" value="tools" current={tab} />
        <TabLink label="By Category" value="categories" current={tab} />
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <RevenueSummary summary={summary} />
          <CostBreakdown monthlyCosts={monthlyCosts} />
        </div>
      )}

      {tab === "tools" && (
        <ToolProfitability tools={toolFinancials} mode="tools" />
      )}

      {tab === "categories" && (
        <ToolProfitability categories={categoryFinancials} mode="categories" />
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
    color === "orange"
      ? "text-orange-600"
      : color === "red"
        ? "text-red-600"
        : color === "purple"
          ? "text-purple-600"
          : color === "yellow"
            ? "text-yellow-600"
            : color === "green"
              ? "text-green-600"
              : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${vc}`}>{value}</p>
    </div>
  );
}

function TabLink({ label, value, current }: { label: string; value: string; current: string }) {
  const isActive = current === value;
  return (
    <a
      href={`/admin/finance?tab=${value}`}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </a>
  );
}