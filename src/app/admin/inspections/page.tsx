import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllTemplates,
  getAllRuns,
  getInspectionStats,
  getActiveTemplatesForDropdown,
  getCategoriesForInspectionDropdown,
} from "@/lib/data/inspections";
import { PageHeader } from "@/components/admin/page-header";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { TemplatesTable } from "./components/templates-table";
import { InspectionRunsTable } from "./components/inspection-runs-table";
import { TemplateForm } from "./components/template-form";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    categoryId?: string;
    triggerType?: string;
    tab?: string;
    runStatus?: string;
    templateId?: string;
    flagged?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Inspections | Admin",
  description: "Manage inspection checklists and run inspections",
};

export default async function AdminInspectionsPage({
  searchParams,
}: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "templates";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [stats, categoryOptions] = await Promise.all([
    getInspectionStats(),
    getCategoriesForInspectionDropdown(),
  ]);

  const templatesResult =
    tab === "templates"
      ? await getAllTemplates({
          q: params.q,
          status: params.status,
          categoryId: params.categoryId,
          triggerType: params.triggerType,
          page,
          pageSize: 25,
        })
      : null;

  const templateDropdown = await getActiveTemplatesForDropdown();

  const runsResult =
    tab === "runs"
      ? await getAllRuns({
          q: params.q,
          status: params.runStatus,
          templateId: params.templateId,
          triggerType: params.triggerType,
          flaggedOnly: params.flagged === "true",
          page,
          pageSize: 25,
        })
      : null;

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Create inspection checklists and track tool inspections"
        actions={
          <TemplateForm mode="create" categoryOptions={categoryOptions} />
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4 text-blue-500" />}
          label="Templates"
          value={stats.totalTemplates}
          sub={`${stats.activeTemplates} active`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          label="In Progress"
          value={stats.inProgressRuns}
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          label="Passed"
          value={stats.passedRuns}
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          label="Failed"
          value={stats.failedRuns}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
          label="Flagged"
          value={stats.flaggedRuns}
        />
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4 text-slate-500" />}
          label="Total Runs"
          value={stats.totalRuns}
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="Templates" value="templates" current={tab} />
        <TabLink label="Inspection Runs" value="runs" current={tab} />
      </div>

      {tab === "templates" && templatesResult && (
        <TemplatesTable
          templates={templatesResult.templates}
          total={templatesResult.total}
          page={templatesResult.page}
          totalPages={templatesResult.totalPages}
          categoryOptions={categoryOptions}
        />
      )}

      {tab === "runs" && runsResult && (
        <InspectionRunsTable
          runs={runsResult.runs}
          total={runsResult.total}
          page={runsResult.page}
          totalPages={runsResult.totalPages}
          templateDropdown={templateDropdown}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
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
      href={`/admin/inspections?tab=${value}`}
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