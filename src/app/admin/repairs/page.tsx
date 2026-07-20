import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllRepairs, getRepairStats } from "@/lib/data/repairs";
import { PageHeader } from "@/components/admin/page-header";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  XCircle,
  Search,
} from "lucide-react";
import { RepairsTable } from "./components/repairs-table";
import { RepairForm } from "./components/repair-form";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Repairs | Admin",
  description: "Track and manage tool repairs",
};

export default async function AdminRepairsPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [stats, result] = await Promise.all([
    getRepairStats(),
    getAllRepairs({
      q: params.q,
      status: params.status,
      priority: params.priority,
      page,
      pageSize: 25,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Repairs"
        description="Track tool repairs from report to completion"
        actions={<RepairForm />}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard icon={<Wrench className="h-4 w-4 text-slate-500" />} label="Total" value={stats.total} />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-red-500" />} label="Reported" value={stats.reported} color="red" />
        <StatCard icon={<Search className="h-4 w-4 text-yellow-500" />} label="Diagnosing" value={stats.diagnosing} color="yellow" />
        <StatCard icon={<Wrench className="h-4 w-4 text-blue-500" />} label="In Repair" value={stats.inRepair} color="blue" />
        <StatCard icon={<Clock className="h-4 w-4 text-orange-500" />} label="Waiting Parts" value={stats.waitingParts} color="orange" />
        <StatCard icon={<CheckCircle className="h-4 w-4 text-green-500" />} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={<XCircle className="h-4 w-4 text-slate-400" />} label="Unrepairable" value={stats.unrepairable} />
      </div>

      {/* Cost summary */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2">
          <DollarSign className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-slate-500">Estimated:</span>
          <span className="font-semibold text-slate-900">
            ${stats.totalEstimatedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm text-slate-500">Actual:</span>
          <span className="font-semibold text-slate-900">
            ${stats.totalActualCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <RepairsTable
        repairs={result.repairs}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  const vc =
    color === "red" ? "text-red-600"
    : color === "yellow" ? "text-yellow-600"
    : color === "blue" ? "text-blue-600"
    : color === "orange" ? "text-orange-600"
    : color === "green" ? "text-green-600"
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