import type { MaintenanceCostByType, RepairAnalytics } from "@/lib/data/analytics";
import { AnalyticsCard, Metric, HorizontalBar } from "./analytics-card";
import { maintenanceTypeBadge } from "@/components/admin/status-badge";

interface MaintenanceAnalyticsProps {
  costByType: MaintenanceCostByType[];
  repairAnalytics: RepairAnalytics;
}

export function MaintenanceAnalyticsView({ costByType, repairAnalytics }: MaintenanceAnalyticsProps) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const maxTypeCost = Math.max(...costByType.map((c) => c.totalCost), 1);
  const maxRepairTool = Math.max(...repairAnalytics.topRepairTools.map((t) => t.repairCount), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance cost by type */}
        <AnalyticsCard title="Maintenance Cost by Type" subtitle="Breakdown of costs across maintenance types">
          <div className="space-y-3">
            {costByType.map((c) => (
              <div key={c.maintenanceType} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">{maintenanceTypeBadge(c.maintenanceType)}</div>
                <div className="flex-1">
                  <div className="h-5 w-full rounded-full bg-slate-100">
                    <div className="h-5 rounded-full bg-orange-400 transition-all" style={{ width: `${Math.max((c.totalCost / maxTypeCost) * 100, 1)}%` }} />
                  </div>
                </div>
                <div className="w-28 flex-shrink-0 text-right">
                  <span className="text-sm font-medium text-slate-900">${fmt(c.totalCost)}</span>
                  <span className="ml-1 text-xs text-slate-400">({c.recordCount})</span>
                </div>
              </div>
            ))}
            {costByType.length === 0 && <p className="text-sm text-slate-400">No maintenance data.</p>}
          </div>
        </AnalyticsCard>

        {/* Repair analytics */}
        <AnalyticsCard title="Repair Analytics" subtitle="Summary of repair activity">
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Total Repairs" value={repairAnalytics.totalRepairs} />
            <Metric label="Completed" value={repairAnalytics.completedRepairs} color="green" />
            <Metric label="Unrepairable" value={repairAnalytics.unrepairableCount} color="red" />
            <Metric label="Avg Cost" value={`$${fmt(repairAnalytics.avgRepairCost)}`} />
            <Metric label="Avg Days" value={repairAnalytics.avgDaysToComplete.toFixed(1)} />
            <Metric
              label="Completion Rate"
              value={
                repairAnalytics.totalRepairs > 0
                  ? `${((repairAnalytics.completedRepairs / repairAnalytics.totalRepairs) * 100).toFixed(0)}%`
                  : "—"
              }
              color="green"
            />
          </div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Most Repaired Tools</h4>
          <div className="space-y-2">
            {repairAnalytics.topRepairTools.map((t, idx) => (
              <HorizontalBar key={idx} label={t.toolName} value={t.repairCount} maxValue={maxRepairTool} color="bg-red-400" />
            ))}
            {repairAnalytics.topRepairTools.length === 0 && <p className="text-sm text-slate-400">No repair data.</p>}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}