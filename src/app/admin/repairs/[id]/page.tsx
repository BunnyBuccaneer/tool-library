import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getRepairById } from "@/lib/data/repairs";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge, toolStatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { format } from "date-fns";
import { Wrench, User, Calendar, DollarSign, AlertTriangle, ExternalLink } from "lucide-react";
import { RepairActions } from "../components/repair-actions";
import { RepairPartsManager } from "../components/repair-parts";

interface PageProps {
  params: Promise<{ id: string }>;
}

function repairStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    reported: { variant: "red", label: "Reported" },
    diagnosing: { variant: "yellow", label: "Diagnosing" },
    in_repair: { variant: "blue", label: "In Repair" },
    waiting_parts: { variant: "orange", label: "Waiting Parts" },
    completed: { variant: "green", label: "Completed" },
    unrepairable: { variant: "slate", label: "Unrepairable" },
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

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const repair = await getRepairById(id);
  return { title: repair ? `${repair.title} | Repairs | Admin` : "Not Found" };
}

export default async function RepairDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const repair = await getRepairById(id);
  if (!repair) notFound();

  const isActive = !["completed", "unrepairable"].includes(repair.status);

  return (
    <div>
      <PageHeader
        title={repair.title}
        description={`${repair.toolName} — ${repair.status.replace(/_/g, " ")}`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Repairs", href: "/admin/repairs" },
              { label: repair.title },
            ]}
          />
        }
        actions={
          <Link href="/admin/repairs" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            ← Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Status</h3>
            <div className="mb-3 flex items-center gap-2">
              {repairStatusBadge(repair.status)}
              {priorityBadge(repair.priority)}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tool</p>
                <p className="font-medium text-slate-900">{repair.toolName}</p>
                {repair.toolAssetId && <p className="font-mono text-xs text-slate-400">{repair.toolAssetId}</p>}
                <div className="mt-1">{toolStatusBadge(repair.toolStatus)}</div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reported By</p>
                <p className="text-slate-700">{repair.reportedByName ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned To</p>
                <p className="text-slate-700">{repair.assignedToName ?? repair.vendorName ?? "Unassigned"}</p>
              </div>
              {repair.vendorName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Vendor</p>
                  <p className="text-slate-700">{repair.vendorName}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reported</p>
                <p className="text-slate-700">{format(new Date(repair.createdAt), "MMM d, yyyy h:mm a")}</p>
              </div>
              {repair.startedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Started</p>
                  <p className="text-slate-700">{format(new Date(repair.startedAt), "MMM d, yyyy h:mm a")}</p>
                </div>
              )}
              {repair.completedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Completed</p>
                  <p className="text-slate-700">{format(new Date(repair.completedAt), "MMM d, yyyy h:mm a")}</p>
                </div>
              )}
              {repair.estimatedCompletion && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Est. Completion</p>
                  <p className="text-slate-700">{format(new Date(repair.estimatedCompletion + "T00:00:00"), "MMM d, yyyy")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Costs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Estimated</p>
                <p className="text-lg font-bold text-slate-700">
                  {repair.estimatedCost ? `$${parseFloat(repair.estimatedCost).toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Actual</p>
                <p className="text-lg font-bold text-green-600">
                  {repair.actualCost ? `$${parseFloat(repair.actualCost).toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <RepairActions repairId={repair.id} currentStatus={repair.status} />
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description / Diagnosis / Resolution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Details</h3>
            <div className="space-y-4">
              {repair.description && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{repair.description}</p>
                </div>
              )}
              {repair.diagnosis && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Diagnosis</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{repair.diagnosis}</p>
                </div>
              )}
              {repair.resolution && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Resolution</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{repair.resolution}</p>
                </div>
              )}
              {!repair.description && !repair.diagnosis && !repair.resolution && (
                <p className="text-sm text-slate-400 italic">No details recorded yet.</p>
              )}
            </div>
          </div>

          {/* Parts */}
          <RepairPartsManager repairId={repair.id} parts={repair.parts} isEditable={isActive} />

          {/* Notes timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Timeline</h3>
            {repair.notes.length > 0 ? (
              <div className="space-y-4">
                {repair.notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full border-2 ${n.isStatusChange ? "border-blue-500 bg-blue-100" : "border-slate-300 bg-slate-100"}`} />
                      <div className="h-full w-px bg-slate-200" />
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{n.authorName ?? "System"}</p>
                        <span className="text-xs text-slate-400">{format(new Date(n.createdAt), "MMM d, yyyy h:mm a")}</span>
                      </div>
                      <p className={`mt-0.5 text-sm ${n.isStatusChange ? "font-medium text-blue-700" : "text-slate-600"}`}>
                        {n.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No timeline entries yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}