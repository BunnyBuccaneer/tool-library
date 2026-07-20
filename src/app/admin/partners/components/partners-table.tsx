"use client";

import { useRouter } from "next/navigation";
import type { PartnerListRecord } from "@/lib/data/partners";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Building2, Wrench, Link as LinkIcon, Users } from "lucide-react";

interface PartnersTableProps {
  partners: PartnerListRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function partnerTypeBadge(type: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    supplier: { variant: "blue", label: "Supplier" },
    vendor: { variant: "purple", label: "Vendor" },
    sponsor: { variant: "pink", label: "Sponsor" },
    manufacturer: { variant: "teal", label: "Manufacturer" },
    service_provider: { variant: "orange", label: "Service Provider" },
  };
  const cfg = map[type] ?? { variant: "slate", label: type };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

function partnerStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "green", label: "Active" },
    inactive: { variant: "slate", label: "Inactive" },
    pending: { variant: "yellow", label: "Pending" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function PartnersTable({ partners: rows, total, page, totalPages }: PartnersTableProps) {
  const router = useRouter();

  const columns: Column<PartnerListRecord>[] = [
    {
      key: "name",
      header: "Partner",
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.description && <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (row) => partnerTypeBadge(row.type) },
    { key: "status", header: "Status", cell: (row) => partnerStatusBadge(row.status) },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="text-sm text-slate-600">
          {row.email && <p>{row.email}</p>}
          {row.phone && <p className="text-xs text-slate-400">{row.phone}</p>}
          {!row.email && !row.phone && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => <span className="text-sm text-slate-600">{[row.city, row.state].filter(Boolean).join(", ") || "—"}</span>,
    },
    {
      key: "links",
      header: "Links",
      cell: (row) => (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {row.contactCount}</span>
          <span className="flex items-center gap-0.5"><Wrench className="h-3 w-3" /> {row.toolLinkCount}</span>
          <span className="flex items-center gap-0.5"><LinkIcon className="h-3 w-3" /> {row.repairLinkCount}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search partners by name, email, phone, city…"
        searchKey="q"
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "supplier", label: "Supplier" },
              { value: "vendor", label: "Vendor" },
              { value: "sponsor", label: "Sponsor" },
              { value: "manufacturer", label: "Manufacturer" },
              { value: "service_provider", label: "Service Provider" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
      />
      <div className="text-sm text-slate-500">{total} partner{total !== 1 ? "s" : ""}</div>
      {rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} onRowClick={(r) => router.push(`/admin/partners/${r.id}`)} />
      ) : (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="No partners found" description="Add your first partner to get started." />
      )}
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}