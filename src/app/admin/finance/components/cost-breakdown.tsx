import type { MonthlyCost } from "@/lib/data/finance";
import { format, parse } from "date-fns";

interface CostBreakdownProps {
  monthlyCosts: MonthlyCost[];
}

export function CostBreakdown({ monthlyCosts }: CostBreakdownProps) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxCost = Math.max(...monthlyCosts.map((m) => m.totalCost), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Monthly Cost Trend (12 Months)</h3>

      {/* Bar chart */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-end gap-2" style={{ minWidth: `${monthlyCosts.length * 60}px`, height: "200px" }}>
          {monthlyCosts.map((m) => {
            const height = maxCost > 0 ? (m.totalCost / maxCost) * 180 : 0;
            const monthLabel = format(parse(m.month, "yyyy-MM", new Date()), "MMM");
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-slate-500">${fmt(m.totalCost)}</span>
                <div className="w-full flex flex-col-reverse" style={{ height: "180px" }}>
                  {m.maintenanceCost > 0 && (
                    <div
                      className="w-full bg-orange-400 rounded-t-sm"
                      style={{ height: `${(m.maintenanceCost / maxCost) * 180}px` }}
                      title={`Maintenance: $${fmt(m.maintenanceCost)}`}
                    />
                  )}
                  {m.repairCost > 0 && (
                    <div
                      className="w-full bg-red-400"
                      style={{ height: `${(m.repairCost / maxCost) * 180}px` }}
                      title={`Repair: $${fmt(m.repairCost)}`}
                    />
                  )}
                  {m.partsCost > 0 && (
                    <div
                      className="w-full bg-purple-400 rounded-t-sm"
                      style={{ height: `${(m.partsCost / maxCost) * 180}px` }}
                      title={`Parts: $${fmt(m.partsCost)}`}
                    />
                  )}
                </div>
                <span className="text-xs text-slate-500">{monthLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Maintenance
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Repairs
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> Parts
        </span>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Month</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Maintenance</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Repairs</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Parts</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyCosts.map((m) => (
              <tr key={m.month}>
                <td className="px-3 py-2 text-slate-700">
                  {format(parse(m.month, "yyyy-MM", new Date()), "MMMM yyyy")}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">${fmt(m.maintenanceCost)}</td>
                <td className="px-3 py-2 text-right text-slate-600">${fmt(m.repairCost)}</td>
                <td className="px-3 py-2 text-right text-slate-600">${fmt(m.partsCost)}</td>
                <td className="px-3 py-2 text-right font-medium text-slate-900">${fmt(m.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}