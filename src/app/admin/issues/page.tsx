import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllIssues, getIssueStats } from "@/lib/data/issues";
import { PageHeader } from "@/components/admin/page-header";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import { IssuesTable } from "./components/issues-table";
import { IssueForm } from "./components/issue-form";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Issues | Admin",
  description: "Track and resolve issues",
};

export default async function AdminIssuesPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [stats, result] = await Promise.all([
    getIssueStats(),
    getAllIssues({
      q: params.q,
      status: params.status,
      priority: params.priority,
      category: params.category,
      page,
      pageSize: 25,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Track, triage, and resolve issues"
        actions={<IssueForm />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard icon={<AlertCircle className="h-4 w-4 text-slate-500" />} label="Total" value={stats.total} />
        <StatCard icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="New" value={stats.new} color="red" />
        <StatCard icon={<Clock className="h-4 w-4 text-yellow-500" />} label="Triaged" value={stats.triaged} color="yellow" />
        <StatCard icon={<AlertCircle className="h-4 w-4 text-blue-500" />} label="Assigned" value={stats.assigned} color="blue" />
        <StatCard icon={<Clock className="h-4 w-4 text-purple-500" />} label="In Progress" value={stats.inProgress} color="purple" />
        <StatCard icon={<CheckCircle className="h-4 w-4 text-green-500" />} label="Resolved" value={stats.resolved} color="green" />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} label="Critical" value={stats.critical} color="orange" />
        <StatCard icon={<LinkIcon className="h-4 w-4 text-teal-500" />} label="Linked" value={stats.linkedToRepair} color="teal" />
      </div>

      <IssuesTable
        issues={result.issues}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const vc = color === "red" ? "text-red-600" : color === "yellow" ? "text-yellow-600" : color === "blue" ? "text-blue-600" : color === "purple" ? "text-purple-600" : color === "green" ? "text-green-600" : color === "orange" ? "text-orange-600" : color === "teal" ? "text-teal-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">{icon}<p className="text-xs font-medium text-slate-500">{label}</p></div>
      <p className={`mt-0.5 text-xl font-bold ${vc}`}>{value}</p>
    </div>
  );
}