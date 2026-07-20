import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllPartners, getPartnerStats } from "@/lib/data/partners";
import { PageHeader } from "@/components/admin/page-header";
import { Building2, Truck, Heart, Users } from "lucide-react";
import { PartnersTable } from "./components/partners-table";
import { PartnerForm } from "./components/partner-form";

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string; status?: string; page?: string }>;
}

export const metadata = { title: "Partners | Admin", description: "Manage partners, suppliers, and vendors" };

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [stats, result] = await Promise.all([
    getPartnerStats(),
    getAllPartners({ q: params.q, type: params.type, status: params.status, page, pageSize: 25 }),
  ]);

  return (
    <div>
      <PageHeader title="Partners" description="Manage suppliers, vendors, and sponsors" actions={<PartnerForm mode="create" />} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard icon={<Building2 className="h-4 w-4 text-slate-500" />} label="Total" value={stats.total} />
        <StatCard icon={<Building2 className="h-4 w-4 text-green-500" />} label="Active" value={stats.active} color="green" />
        <StatCard icon={<Building2 className="h-4 w-4 text-slate-400" />} label="Inactive" value={stats.inactive} />
        <StatCard icon={<Building2 className="h-4 w-4 text-yellow-500" />} label="Pending" value={stats.pending} color="yellow" />
        <StatCard icon={<Truck className="h-4 w-4 text-blue-500" />} label="Suppliers" value={stats.suppliers} color="blue" />
        <StatCard icon={<Users className="h-4 w-4 text-purple-500" />} label="Vendors" value={stats.vendors} color="purple" />
        <StatCard icon={<Heart className="h-4 w-4 text-pink-500" />} label="Sponsors" value={stats.sponsors} color="pink" />
      </div>

      <PartnersTable partners={result.partners} total={result.total} page={result.page} totalPages={result.totalPages} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const vc = color === "green" ? "text-green-600" : color === "yellow" ? "text-yellow-600" : color === "blue" ? "text-blue-600" : color === "purple" ? "text-purple-600" : color === "pink" ? "text-pink-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">{icon}<p className="text-xs font-medium text-slate-500">{label}</p></div>
      <p className={`mt-0.5 text-xl font-bold ${vc}`}>{value}</p>
    </div>
  );
}