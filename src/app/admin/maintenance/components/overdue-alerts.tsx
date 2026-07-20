import type { ScheduleListItem } from "@/lib/data/maintenance";
import { AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { maintenanceTypeBadge } from "@/components/admin/status-badge";

interface OverdueAlertsProps {
  schedules: ScheduleListItem[];
}

export function OverdueAlerts({ schedules }: OverdueAlertsProps) {
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="text-sm font-semibold text-red-800">
          Overdue Maintenance ({schedules.length})
        </h3>
      </div>
      <div className="space-y-2">
        {schedules.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-4 py-2.5 border border-red-100"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-slate-900">{s.toolName}</p>
                <p className="text-xs text-slate-500">{s.title}</p>
              </div>
              {maintenanceTypeBadge(s.maintenanceType)}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-red-600">
                Due {format(new Date(s.nextDueAt), "MMM d, yyyy")}
              </p>
              <p className="text-xs text-red-500">
                {formatDistanceToNow(new Date(s.nextDueAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}