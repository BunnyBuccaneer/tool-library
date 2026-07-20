"use client";

import { useRouter } from "next/navigation";
import type { MemberListRecord } from "@/lib/data/members";
import {
  DataTable,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, Pagination } from "@/components/admin/filter-bar";
import {
  memberStatusBadge,
  userRoleBadge,
} from "@/components/admin/status-badge";
import { format } from "date-fns";

interface MembersTableProps {
  members: MemberListRecord[];
  total: number;
  page: number;
  totalPages: number;
  filterLocations: { id: string; name: string }[];
  currentFilters: {
    q: string;
    status: string;
    role: string;
    locationId: string;
  };
}

function formatDateSafe(
  value: string | Date | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (!value) return "—";
  const d =
    value instanceof Date ? value : new Date(String(value) + "T00:00:00");
  return isNaN(d.getTime()) ? "—" : format(d, pattern);
}

export function MembersTable({
  members,
  total,
  page,
  totalPages,
  filterLocations,
  currentFilters,
}: MembersTableProps) {
  const router = useRouter();

  const columns: Column<MemberListRecord>[] = [
    {
      key: "member",
      header: "Member",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {(row.name ?? row.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.name ?? "No name"}
            </p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "memberNumber",
      header: "Member #",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.memberNumber}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => memberStatusBadge(row.membershipStatus),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => userRoleBadge(row.role),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {row.preferredLocationName ?? "—"}
        </span>
      ),
    },
    {
      key: "reservations",
      header: "Reservations",
      cell: (row) => (
        <div className="text-sm">
          <span className="font-medium text-slate-900">
            {row.activeReservations}
          </span>
          <span className="text-slate-400"> / {row.totalReservations}</span>
        </div>
      ),
    },
    {
      key: "joinDate",
      header: "Joined",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {formatDateSafe(row.joinDate)}
        </span>
      ),
    },
    {
      key: "active",
      header: "Account",
      cell: (row) => (
        <span
          className={`text-xs font-medium ${
            row.isActive ? "text-green-600" : "text-red-500"
          }`}
        >
          {row.isActive ? "Active" : "Disabled"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchPlaceholder="Search by name, email, member #, phone…"
        searchKey="q"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
              { value: "expired", label: "Expired" },
              { value: "pending", label: "Pending" },
            ],
          },
          {
            key: "role",
            label: "Role",
            options: [
              { value: "super_admin", label: "Super Admin" },
              { value: "admin", label: "Admin" },
              { value: "manager", label: "Manager" },
              { value: "employee", label: "Employee" },
              { value: "member", label: "Member" },
            ],
          },
          {
            key: "locationId",
            label: "Location",
            options: filterLocations.map((l) => ({
              value: l.id,
              label: l.name,
            })),
          },
        ]}
      />

      <div className="text-sm text-slate-500">
        {total} member{total !== 1 ? "s" : ""} found
      </div>

      <DataTable
        columns={columns}
        rows={members}
        getRowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/members/${row.id}`)}
      />

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}