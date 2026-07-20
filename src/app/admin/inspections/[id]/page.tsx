import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getTemplateById, getRunById } from "@/lib/data/inspections";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { format } from "date-fns";
import {
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { TemplateForm } from "../components/template-form";
import { InspectionDetailView } from "../components/inspection-detail-view";
import { ItemManager } from "./item-manager";
import { getCategoriesForInspectionDropdown } from "@/lib/data/inspections";
import type { TemplateItemRecord } from "@/lib/data/inspections";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper to validate UUID format
function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    return { title: "Not Found | Inspections | Admin" };
  }

  const template = await getTemplateById(id);
  const run = template ? null : await getRunById(id);
  const title = template?.name ?? run?.templateName ?? "Not Found";
  return { title: `${title} | Inspections | Admin` };
}

export default async function InspectionDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;

  // Guard against non-UUID values in the URL (like literal "[id]")
  if (!isValidUuid(id)) {
    notFound();
  }

  // Try template first, then run
  const template = await getTemplateById(id);

  if (template) {
    const categoryOptions = await getCategoriesForInspectionDropdown();
    return (
      <TemplateDetailView
        template={template}
        categoryOptions={categoryOptions}
      />
    );
  }

  const run = await getRunById(id);
  if (run) {
    return <RunDetailView run={run} />;
  }

  notFound();
}

// ─── Template detail ──────────────────────────────────────────────────────────

function TemplateDetailView({
  template,
  categoryOptions,
}: {
  template: NonNullable<Awaited<ReturnType<typeof getTemplateById>>>;
  categoryOptions: { id: string; name: string }[];
}) {
  function triggerLabel(t: string) {
    const map: Record<string, string> = {
      checkout: "Checkout",
      checkin: "Check-in",
      both: "Both",
      manual: "Manual",
    };
    return map[t] ?? t;
  }

  return (
    <div>
      <PageHeader
        title={template.name}
        description={template.description ?? "Inspection checklist template"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Inspections", href: "/admin/inspections" },
              { label: template.name },
            ]}
          />
        }
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/inspections"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Back
            </Link>
            <TemplateForm
              mode="edit"
              categoryOptions={categoryOptions}
              template={{
                id: template.id,
                name: template.name,
                description: template.description,
                categoryId: template.categoryId,
                triggerType: template.triggerType,
                sortOrder: template.sortOrder,
              }}
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge
                    variant={
                      template.status === "active" ? "green" : "slate"
                    }
                    label={
                      template.status === "active" ? "Active" : "Inactive"
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Category
                </p>
                <p className="text-slate-700">
                  {template.categoryName ?? "All categories"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Trigger
                </p>
                <p className="text-slate-700">
                  {triggerLabel(template.triggerType)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Checklist Items
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {template.itemCount}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Runs
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {template.runCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Checklist Items
              </h3>
            </div>

            {template.items.length > 0 ? (
              <div className="space-y-2">
                {template.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between rounded-lg border p-3 ${
                      item.isCritical
                        ? "border-orange-200 bg-orange-50/30"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 border border-slate-200">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                        {item.isCritical && (
                          <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            Critical — auto-flags for repair on fail
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ClipboardCheck className="h-7 w-7" />}
                title="No checklist items"
                description="Add items to this inspection template."
              />
            )}

            <div className="mt-4">
              <ItemManager
                templateId={template.id}
                existingItems={template.items}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Run detail ───────────────────────────────────────────────────────────────

function RunDetailView({
  run,
}: {
  run: NonNullable<Awaited<ReturnType<typeof getRunById>>>;
}) {
  function runStatusBadge(status: string) {
    const map: Record<string, { variant: BadgeVariant; label: string }> = {
      in_progress: { variant: "yellow", label: "In Progress" },
      passed: { variant: "green", label: "Passed" },
      failed: { variant: "red", label: "Failed" },
      flagged: { variant: "orange", label: "Flagged" },
    };
    const cfg = map[status] ?? { variant: "slate", label: status };
    return <StatusBadge variant={cfg.variant} label={cfg.label} />;
  }

  return (
    <div>
      <PageHeader
        title={`Inspection: ${run.toolName}`}
        description={`Template: ${run.templateName}`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Inspections", href: "/admin/inspections?tab=runs" },
              { label: run.toolName },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/inspections?tab=runs"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Runs
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Run info card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Inspection Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {runStatusBadge(run.status)}
                  {run.flaggedForRepair && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                      Flagged for Repair
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tool
                </p>
                <p className="font-medium text-slate-900">{run.toolName}</p>
                {run.toolAssetId && (
                  <p className="font-mono text-xs text-slate-400">
                    {run.toolAssetId}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Performed By
                </p>
                <p className="text-slate-700">
                  {run.performedByName ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Trigger
                </p>
                <p className="capitalize text-slate-700">{run.triggerType}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Started
                </p>
                <p className="text-slate-700">
                  {format(new Date(run.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              {run.completedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Completed
                  </p>
                  <p className="text-slate-700">
                    {format(new Date(run.completedAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Results
                </p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="text-green-600 font-medium">
                    {run.passCount} passed
                  </span>
                  <span className="text-red-600 font-medium">
                    {run.failCount} failed
                  </span>
                  <span className="text-slate-400">
                    {run.totalItems} total
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes card */}
          {run.notes && run.status !== "in_progress" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Notes
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {run.notes}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {run.status === "in_progress"
                ? "Complete Inspection"
                : "Inspection Results"}
            </h3>
            <InspectionDetailView run={run} />
          </div>
        </div>
      </div>
    </div>
  );
}