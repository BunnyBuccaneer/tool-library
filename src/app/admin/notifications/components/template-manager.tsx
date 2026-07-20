"use client";

import { useState, useTransition } from "react";
import type { TemplateListRecord } from "@/lib/data/admin-notifications";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/admin-notifications";
import { FileText, Plus, Pencil, Trash2, X } from "lucide-react";
import { format } from "date-fns";

interface TemplateManagerProps {
  templates: TemplateListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function notifTypeBadge(type: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    reservation_reminder: { variant: "blue", label: "Reservation" },
    pickup_reminder: { variant: "purple", label: "Pickup" },
    return_reminder: { variant: "orange", label: "Return" },
    overdue: { variant: "red", label: "Overdue" },
    membership_expiring: { variant: "yellow", label: "Expiring" },
    general: { variant: "slate", label: "General" },
  };
  const cfg = map[type] ?? { variant: "slate", label: type };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function TemplateManager({ templates, total, page, totalPages }: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<TemplateListRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const openCreate = () => { setEditTarget(null); setName(""); setType("general"); setSubject(""); setBody(""); setShowForm(true); setError(null); };
  const openEdit = (t: TemplateListRecord) => { setEditTarget(t); setName(t.name); setType(t.type); setSubject(t.subject); setBody(t.body); setShowForm(true); setError(null); };

  const handleSubmit = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) { setError("Name, subject, and body are required."); return; }
    setError(null);
    startTransition(async () => {
      let result;
      if (editTarget) {
        result = await updateTemplate(editTarget.id, { name: name.trim(), type: type as any, subject: subject.trim(), body: body.trim() });
      } else {
        result = await createTemplate({ name: name.trim(), type: type as any, subject: subject.trim(), body: body.trim() });
      }
      if (result.success) { setShowForm(false); }
      else setError(result.error ?? "Failed.");
    });
  };

  const columns: Column<TemplateListRecord>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{row.subject}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (row) => notifTypeBadge(row.type) },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge variant={row.status === "active" ? "green" : "slate"} label={row.status === "active" ? "Active" : "Inactive"} />,
    },
    { key: "batches", header: "Uses", cell: (row) => <span className="text-sm text-slate-600">{row.batchCount}</span> },
    { key: "created", header: "Created", cell: (row) => <span className="text-xs text-slate-500">{format(new Date(row.createdAt), "MMM d, yyyy")}</span> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
      className: "w-20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FilterBar
          searchPlaceholder="Search templates…"
          searchKey="q"
          filters={[
            { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
            {
              key: "type", label: "Type",
              options: [
                { value: "general", label: "General" }, { value: "reservation_reminder", label: "Reservation" },
                { value: "pickup_reminder", label: "Pickup" }, { value: "return_reminder", label: "Return" },
                { value: "overdue", label: "Overdue" }, { value: "membership_expiring", label: "Expiring" },
              ],
            },
          ]}
          className="flex-1"
        />
        <button onClick={openCreate} className="ml-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"><Plus className="h-4 w-4" /> New Template</button>
      </div>

      <div className="text-sm text-slate-500">{total} template{total !== 1 ? "s" : ""}</div>

      {templates.length > 0 ? (
        <DataTable columns={columns} rows={templates} getRowKey={(r) => r.id} />
      ) : (
        <EmptyState icon={<FileText className="h-7 w-7" />} title="No templates" description="Create a notification template to reuse." />
      )}

      <Pagination page={page} totalPages={totalPages} />

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button onClick={() => setShowForm(false)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">{editTarget ? "Edit Template" : "New Template"}</h3>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Type</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="general">General</option><option value="reservation_reminder">Reservation</option><option value="pickup_reminder">Pickup</option><option value="return_reminder">Return</option><option value="overdue">Overdue</option><option value="membership_expiring">Expiring</option></select></div>
              </div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Body *</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleSubmit} disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Saving…" : editTarget ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) await deleteTemplate(deleteTarget.id); }}
        title="Delete Template"
        description={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}