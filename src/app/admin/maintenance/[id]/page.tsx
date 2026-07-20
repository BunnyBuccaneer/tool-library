import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getMaintenanceRecordById, getStaffForDropdown } from "@/lib/data/maintenance";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { maintenanceTypeBadge, StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { format } from "date-fns";
import { Wrench, Calendar, DollarSign, User, Clock } from "lucide-react";
import { AssignStaffForm } from "./assign-staff-form";
import { AssignmentActions } from "./assignment-actions";
import type { AssignmentRecord } from "@/lib/data/maintenance";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const record = await getMaintenanceRecordById(id);
  return {
    title: record
      ? `${record.toolName} Maintenance | Admin`
      : "Not Found",
  };
}

export default async function MaintenanceDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const record = await getMaintenanceRecordById(id);
  if (!record) notFound();

  const staffOptions = await getStaffForDropdown();

  function assignmentStatusBadge(status: string) {
    const map: Record<string, { variant: BadgeVariant; label: string }> = {
      pending: { variant: "yellow", label: "Pending" },
      in_progress: { variant: "blue", label: "In Progress" },
      completed: { variant: "green", label: "Completed" },
      skipped: { variant: "slate", label: "Skipped" },
    };
    const cfg = map[status] ?? { variant: "slate", label: status };
    return <StatusBadge variant={cfg.variant} label={cfg.label} />;
  }

  return (
    <div>
      <PageHeader
        title={`Maintenance: ${record.toolName}`}
        description={record.description}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Maintenance", href: "/admin/maintenance" },
              { label: record.toolName },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/maintenance"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Details card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tool</p>
                <p className="font-medium text-slate-900">{record.toolName}</p>
                {record.toolAssetId && (
                  <p className="font-mono text-xs text-slate-400">{record.toolAssetId}</p>
                )}
                {record.toolBrand && (
                  <p className="text-xs text-slate-500">
                    {record.toolBrand}{record.toolModel ? ` ${record.toolModel}` : ""}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</p>
                <div className="mt-1">{maintenanceTypeBadge(record.maintenanceType)}</div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cost</p>
                <p className="text-slate-700">
                  {record.cost ? `$${parseFloat(record.cost).toFixed(2)}` : "No cost recorded"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Performed By</p>
                <p className="text-slate-700">{record.performedByName ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Performed At</p>
                <p className="text-slate-700">
                  {format(new Date(record.performedAt), "MMMM d, yyyy h:mm a")}
                </p>
              </div>
              {record.nextDueAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Next Due</p>
                  <p className={`${new Date(record.nextDueAt) <= new Date() ? "font-medium text-red-600" : "text-slate-700"}`}>
                    {format(new Date(record.nextDueAt), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Notes</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {record.notes || "No notes."}
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Assignments */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Staff Assignments
              </h3>
              <AssignStaffForm
                maintenanceRecordId={record.id}
                staffOptions={staffOptions}
              />
            </div>

            {record.assignments.length > 0 ? (
              <div className="space-y-3">
                {record.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {(a.assignedToName ?? a.assignedToEmail).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {a.assignedToName ?? a.assignedToEmail}
                        </p>
                        <p className="text-xs text-slate-500">{a.assignedToEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {assignmentStatusBadge(a.status)}
                      <AssignmentActions
                        assignmentId={a.id}
                        currentStatus={a.status}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No staff assigned yet. Assign someone to handle this maintenance task.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}