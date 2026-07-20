"use client";

import { useState } from "react";
import type { MemberCertListRecord } from "@/lib/data/certifications";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { revokeMemberCert, deleteMemberCert } from "@/lib/actions/certifications";
import { Award, Ban, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AssignCertForm } from "./assign-cert-form"; // Correctly imports from same directory!

interface MemberCertsTableProps {
  certs: MemberCertListRecord[];
  total: number;
  page: number;
  totalPages: number;
  certTypeDropdown: { id: string; name: string }[];
}

function certStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    valid: { variant: "green", label: "Valid" },
    expired: { variant: "red", label: "Expired" },
    revoked: { variant: "slate", label: "Revoked" },
    pending: { variant: "yellow", label: "Pending" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function MemberCertsTable({
  certs,
  total,
  page,
  totalPages,
  certTypeDropdown,
}: MemberCertsTableProps) {
  const [revokeTarget, setRevokeTarget] = useState<MemberCertListRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberCertListRecord | null>(null);

  const columns: Column<MemberCertListRecord>[] = [
    {
      key: "member",
      header: "Member",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.userName ?? "No name"}
          </p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: "certType",
      header: "Certification",
      cell: (row) => (
        <span className="font-medium text-slate-700">{row.certTypeName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => certStatusBadge(row.status),
    },
    {
      key: "issued",
      header: "Issued",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.issuedDate
            ? format(new Date(row.issuedDate + "T00:00:00"), "MMM d, yyyy")
            : "—"}
        </span>
      ),
    },
    {
      key: "expiry",
      header: "Expiry",
      cell: (row) => {
        if (!row.expiryDate) return <span className="text-sm text-slate-400">Lifetime</span>;
        const expDate = new Date(row.expiryDate + "T00:00:00");
        const isExpired = expDate < new Date();
        const isExpiringSoon =
          !isExpired &&
          expDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        return (
          <span
            className={`text-sm ${
              isExpired
                ? "font-medium text-red-600"
                : isExpiringSoon
                  ? "font-medium text-yellow-600"
                  : "text-slate-600"
            }`}
          >
            {format(expDate, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      key: "certNumber",
      header: "Cert #",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.certificateNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "valid" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevokeTarget(row);
              }}
              className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Revoke"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "w-20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          searchPlaceholder="Search members or certifications…"
          searchKey="q"
          filters={[
            {
              key: "certStatus",
              label: "Status",
              options: [
                { value: "valid", label: "Valid" },
                { value: "expired", label: "Expired" },
                { value: "revoked", label: "Revoked" },
                { value: "pending", label: "Pending" },
              ],
            },
            {
              key: "certTypeId",
              label: "Cert Type",
              options: certTypeDropdown.map((ct) => ({
                value: ct.id,
                label: ct.name,
              })),
            },
            {
              key: "expiring",
              label: "Expiring",
              options: [{ value: "30", label: "Within 30 days" }],
            },
          ]}
          className="flex-1"
        />
        <AssignCertForm />
      </div>

      <div className="text-sm text-slate-500">
        {total} member certification{total !== 1 ? "s" : ""}
      </div>

      {certs.length > 0 ? (
        <DataTable
          columns={columns}
          rows={certs}
          getRowKey={(row) => row.id}
        />
      ) : (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="No member certifications"
          description="Assign certifications to members to track their qualifications."
        />
      )}

      <Pagination page={page} totalPages={totalPages} />

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={async () => {
          if (revokeTarget) {
            await revokeMemberCert(revokeTarget.id);
          }
        }}
        title="Revoke Certification"
        description={`Revoke ${revokeTarget?.certTypeName} certification for ${revokeTarget?.userName ?? revokeTarget?.userEmail}? This member will no longer be certified for associated tools.`}
        confirmLabel="Revoke"
        variant="danger"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMemberCert(deleteTarget.id);
          }
        }}
        title="Delete Certification Record"
        description={`Permanently delete this certification record for ${deleteTarget?.userName ?? deleteTarget?.userEmail}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}