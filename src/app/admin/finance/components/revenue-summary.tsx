import type { FinancialSummary } from "@/lib/data/finance";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface RevenueSummaryProps {
  summary: FinancialSummary;
}

export function RevenueSummary({ summary }: RevenueSummaryProps) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const costItems = [
    { label: "Maintenance", value: summary.totalMaintenanceCost, color: "bg-orange-500" },
    { label: "Repairs", value: summary.totalRepairCost, color: "bg-red-500" },
    { label: "Parts", value: summary.totalPartsCost, color: "bg-purple-500" },
    { label: "Vendor", value: summary.totalVendorCost, color: "bg-teal-500" },
  ];

  const totalCost = summary.totalCombinedCost || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Cost Composition</h3>

      {/* Bar chart */}
      <div className="mb-6">
        <div className="mb-2 flex h-8 overflow-hidden rounded-full bg-slate-100">
          {costItems.map((item, idx) => {
            const pct = (item.value / totalCost) * 100;
            if (pct < 0.5) return null;
            return (
              <div
                key={idx}
                className={`${item.color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${item.label}: $${fmt(item.value)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4">
          {costItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-600">
                {item.label}: ${fmt(item.value)} ({((item.value / totalCost) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Net position */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Net Asset Position</p>
            <p className="text-xs text-slate-400">Replacement value minus total costs</p>
          </div>
          <div className="flex items-center gap-2">
            {summary.netPosition >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span
              className={`text-2xl font-bold ${
                summary.netPosition >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${fmt(Math.abs(summary.netPosition))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}