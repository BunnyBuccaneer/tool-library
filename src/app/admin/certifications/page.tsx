import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllCertTypes,
  getAllMemberCerts,
  getCertStats,
  getActiveCertTypesForDropdown,
} from "@/lib/data/certifications";
import { PageHeader } from "@/components/admin/page-header";
import { Award, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { CertTypesTable } from "./components/cert-types-table";
import { MemberCertsTable } from "./components/member-certs-table";
import { CertTypeForm } from "./components/cert-type-form";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tab?: string;
    certStatus?: string;
    certTypeId?: string;
    expiring?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Certifications | Admin",
  description: "Manage certification types and member certifications",
};

export default async function AdminCertificationsPage({
  searchParams,
}: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "types";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const stats = await getCertStats();
  const certTypeDropdown = await getActiveCertTypesForDropdown();

  const certTypesResult =
    tab === "types"
      ? await getAllCertTypes({
          q: params.q,
          status: params.status,
          page,
          pageSize: 25,
        })
      : null;

  const memberCertsResult =
    tab === "members"
      ? await getAllMemberCerts({
          q: params.q,
          status: params.certStatus,
          certTypeId: params.certTypeId,
          expiringWithinDays: params.expiring === "30" ? 30 : undefined,
          page,
          pageSize: 25,
        })
      : null;

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Manage certification types and track member certifications"
        actions={<CertTypeForm mode="create" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Award className="h-5 w-5 text-blue-500" />}
          label="Cert Types"
          value={stats.totalCertTypes}
          sub={`${stats.activeCertTypes} active`}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-green-500" />}
          label="Valid Certs"
          value={stats.validMemberCerts}
          sub={`of ${stats.totalMemberCerts} total`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          label="Pending"
          value={stats.pendingMemberCerts}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Expiring (30d)"
          value={stats.expiringIn30Days}
          sub={`${stats.expiredMemberCerts} expired`}
        />
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="Cert Types" value="types" current={tab} />
        <TabLink label="Member Certs" value="members" current={tab} />
      </div>

      {tab === "types" && certTypesResult && (
        <CertTypesTable
          certTypes={certTypesResult.certTypes}
          total={certTypesResult.total}
          page={certTypesResult.page}
          totalPages={certTypesResult.totalPages}
        />
      )}

      {tab === "members" && memberCertsResult && (
        <MemberCertsTable
          certs={memberCertsResult.certs}
          total={memberCertsResult.total}
          page={memberCertsResult.page}
          totalPages={memberCertsResult.totalPages}
          certTypeDropdown={certTypeDropdown}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function TabLink({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current: string;
}) {
  const isActive = current === value;
  return (
    <a
      href={`/admin/certifications?tab=${value}`}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </a>
  );
}