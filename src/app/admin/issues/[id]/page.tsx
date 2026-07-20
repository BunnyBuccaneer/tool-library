import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getIssueById, getStaffForIssueDropdown, getRepairsForLinking } from "@/lib/data/issues";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { format } from "date-fns";
import { AlertCircle, User, Calendar, Tag, Link as LinkIcon, Wrench } from "lucide-react";
import { IssueActions } from "../components/issue-actions";
import { IssueComments } from "../components/issue-comments";

interface PageProps {
  params: Promise<{ id: string }>;
}

function issueStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    new: { variant: "red", label: "New" },
    triaged: { variant: "yellow", label: "Triaged" },
    assigned: { variant: "blue", label: "Assigned" },
    in_progress: { variant: "purple", label: "In Progress" },
    resolved: { variant: "green", label: "Resolved" },
    closed: { variant: "slate", label: "Closed" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

function priorityBadge(priority: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    low: { variant: "slate", label: "Low" },
    medium: { variant: "blue", label: "Medium" },
    high: { variant: "orange", label: "High" },
    critical: { variant: "red", label: "Critical" },
  };
  const cfg = map[priority] ?? { variant: "slate", label: priority };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

function categoryBadge(cat: string) {
  const labels: Record<string, string> = {
    damage: "Damage", malfunction: "Malfunction", missing_part: "Missing Part",
    safety: "Safety", cosmetic: "Cosmetic", other: "Other",
  };
  return <StatusBadge dot={false} variant="slate" label={labels[cat] ?? cat} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const issue = await getIssueById(id);
  return { title: issue ? `${issue.title} | Issues | Admin` : "Not Found" };
}

export default async function IssueDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) notFound();

  const [staffOptions, repairOptions] = await Promise.all([
    getStaffForIssueDropdown(),
    getRepairsForLinking(),
  ]);

  return (
    <div>
      <PageHeader
        title={issue.title}
        description={issue.toolName ? `Tool: ${issue.toolName}` : "General issue"}
        breadcrumb={
          <Breadcrumb items={[
            { label: "Admin", href: "/admin" },
            { label: "Issues", href: "/admin/issues" },
            { label: issue.title },
          ]} />
        }
        actions={
          <Link href="/admin/issues" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">← Back</Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Details</h3>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {issueStatusBadge(issue.status)}
              {priorityBadge(issue.priority)}
              {categoryBadge(issue.category)}
            </div>
            <div className="space-y-3 text-sm">
              {issue.toolName && (
                <InfoRow icon={<Wrench className="h-4 w-4" />} label="Tool" value={issue.toolName} />
              )}
              <InfoRow icon={<User className="h-4 w-4" />} label="Reported By" value={issue.reportedByName ?? "Unknown"} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Assigned To" value={issue.assignedToName ?? "Unassigned"} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={format(new Date(issue.createdAt), "MMM d, yyyy h:mm a")} />
              {issue.resolvedAt && (
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Resolved" value={format(new Date(issue.resolvedAt), "MMM d, yyyy h:mm a")} />
              )}
              {issue.closedAt && (
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Closed" value={format(new Date(issue.closedAt), "MMM d, yyyy h:mm a")} />
              )}
            </div>
          </div>

          {/* Linked repair */}
          {issue.repairId && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
              <div className="mb-2 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-teal-800">Linked Repair</h3>
              </div>
              <p className="font-medium text-slate-900">{issue.repairTitle}</p>
              <p className="text-xs text-slate-500">Status: {issue.repairStatus}</p>
              <Link href={`/admin/repairs/${issue.repairId}`} className="mt-2 inline-block text-sm font-medium text-teal-600 hover:text-teal-700">
                View Repair →
              </Link>
            </div>
          )}

          {/* Actions */}
          <IssueActions
            issueId={issue.id}
            currentStatus={issue.status}
            currentAssignedToId={issue.assignedToId}
            currentRepairId={issue.repairId}
            staffOptions={staffOptions}
            repairOptions={repairOptions}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Description</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{issue.description || "No description provided."}</p>
            {issue.resolution && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-700">Resolution</p>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{issue.resolution}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <IssueComments issueId={issue.id} comments={issue.comments} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}