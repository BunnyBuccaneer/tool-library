import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getPartnerById, getToolsForPartnerDropdown, getRepairsForPartnerDropdown } from "@/lib/data/partners";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { format } from "date-fns";
import { Building2, Mail, Phone, MapPin, Globe, Calendar } from "lucide-react";
import { PartnerForm } from "../components/partner-form";
import { PartnerActions } from "../components/partner-actions";
import { ContactsManager, ToolLinksManager, RepairLinksManager } from "../components/partner-links";

interface PageProps {
  params: Promise<{ id: string }>;
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

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const partner = await getPartnerById(id);
  return { title: partner ? `${partner.name} | Partners | Admin` : "Not Found" };
}

export default async function PartnerDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const partner = await getPartnerById(id);
  if (!partner) notFound();

  const [toolOptions, repairOptions] = await Promise.all([
    getToolsForPartnerDropdown(),
    getRepairsForPartnerDropdown(),
  ]);

  return (
    <div>
      <PageHeader
        title={partner.name}
        description={partner.description ?? "Partner"}
        breadcrumb={<Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Partners", href: "/admin/partners" }, { label: partner.name }]} />}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/partners" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">← Back</Link>
            <PartnerForm mode="edit" partner={{ id: partner.id, name: partner.name, type: partner.type, description: partner.description, website: partner.website, email: partner.email, phone: partner.phone, address: partner.address, city: partner.city, state: partner.state, zipCode: partner.zipCode }} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Info card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {partnerStatusBadge(partner.status)}
              {partnerTypeBadge(partner.type)}
            </div>
            <div className="space-y-3 text-sm">
              {partner.email && <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={partner.email} />}
              {partner.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={partner.phone} />}
              {partner.website && <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={partner.website} />}
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={[partner.address, partner.city, partner.state, partner.zipCode].filter(Boolean).join(", ") || "—"} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={format(new Date(partner.createdAt), "MMM d, yyyy")} />
            </div>
          </div>

          {/* Notes */}
          {partner.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{partner.notes}</p>
            </div>
          )}

          <PartnerActions partnerId={partner.id} currentStatus={partner.status} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <ContactsManager partnerId={partner.id} contacts={partner.contacts} />
          <ToolLinksManager partnerId={partner.id} toolLinks={partner.toolLinks} toolOptions={toolOptions} />
          <RepairLinksManager partnerId={partner.id} repairLinks={partner.repairLinks} repairOptions={repairOptions} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}