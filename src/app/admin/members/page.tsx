import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllMembers,
  getMemberStats,
  getMemberFilterLocations,
} from "@/lib/data/members";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Users } from "lucide-react";
import { MembersTable } from "./components/members-table";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    role?: string;
    locationId?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Members | Admin",
  description: "Manage member database",
};

export default async function AdminMembersPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [result, stats, filterLocations] = await Promise.all([
    getAllMembers({
      q: params.q,
      status: params.status,
      role: params.role,
      locationId: params.locationId,
      page,
      pageSize: 25,
    }),
    getMemberStats(),
    getMemberFilterLocations(),
  ]);

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${stats.totalMembers} total members — ${stats.activeMembers} active, ${stats.suspendedMembers} suspended, ${stats.expiredMembers} expired`}
      />

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.totalMembers} />
        <StatCard label="Active" value={stats.activeMembers} color="green" />
        <StatCard
          label="Suspended"
          value={stats.suspendedMembers}
          color="red"
        />
        <StatCard label="Expired" value={stats.expiredMembers} color="orange" />
      </div>

      {/* Table with built-in filters */}
      <MembersTable
        members={result.members}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        filterLocations={filterLocations}
        currentFilters={{
          q: params.q ?? "",
          status: params.status ?? "",
          role: params.role ?? "",
          locationId: params.locationId ?? "",
        }}
      />

      {result.members.length === 0 && (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No members found"
          description="Try adjusting your search or filter criteria."
          className="mt-4"
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "green" | "red" | "orange";
}) {
  const valueColor =
    color === "green"
      ? "text-green-600"
      : color === "red"
        ? "text-red-600"
        : color === "orange"
          ? "text-orange-600"
          : "text-slate-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}