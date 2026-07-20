import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getToolBySlug,
  getToolReservations,
  getRelatedTools,
} from "@/lib/data/tools";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/tools/image-gallery";
import { ReservationCard } from "@/components/tools/reservation-card";
import { ToolSpecifications } from "@/components/tools/tool-specifications";
import { ToolSafetyInfo } from "@/components/tools/tool-safety-info";
import { ToolAccessories } from "@/components/tools/tool-accessories";
import { ToolDocuments } from "@/components/tools/tool-documents";
import { RelatedTools } from "@/components/tools/related-tools";
import {
  getSkillLevelColor,
  getStatusColor,
  formatStatus,
  formatSkillLevel,
} from "@/lib/utils";
import {
  ArrowLeft,
  Tag,
  BarChart3,
  MapPin,
  Hash,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { addMonths } from "date-fns";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found | Tool Library" };
  return {
    title: `${tool.name} | Tool Library`,
    description: tool.description || `${tool.name} by ${tool.brand ?? ""}`,
  };
}

function toDate(v: unknown) {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(`${v}T00:00:00`);
  return new Date(v as string);
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const startDate = new Date();
  const endDate = addMonths(startDate, 3);

  const [reservationsData, relatedTools, session] = await Promise.all([
    getToolReservations(tool.id, startDate, endDate),
    getRelatedTools(tool.categoryId ?? "", tool.id, 3),
    auth(),
  ]);

  const userId = session?.user?.id;

  const reservations = reservationsData.map((r) => ({
    id: r.id,
    pickupDate: toDate(r.pickupDate),
    returnDate: toDate(r.returnDate),
    status: r.status,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All Tools
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href={`/tools?category=${tool.category.slug}`}
            className="text-slate-500 transition-colors hover:text-slate-900"
          >
            {tool.category.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="max-w-[200px] truncate font-medium text-slate-900">
            {tool.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <ImageGallery
              images={tool.images}
              fallbackImage={tool.imageUrl}
              toolName={tool.name}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {tool.category.name}
                </Badge>
                <Badge className={getStatusColor(tool.status)}>
                  {formatStatus(tool.status)}
                </Badge>
                <Badge className={getSkillLevelColor(tool.skillLevel ?? "")}>
                  {formatSkillLevel(tool.skillLevel ?? "")}
                </Badge>
              </div>

              {tool.assetId && (
                <p className="mb-2 text-xs font-mono text-slate-400">
                  Asset ID: {tool.assetId}
                </p>
              )}

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {tool.name}
              </h1>

              {tool.brand && (
                <p className="mt-2 text-lg text-slate-600">
                  {tool.brand}
                  {tool.model && (
                    <span className="text-slate-400"> · {tool.model}</span>
                  )}
                </p>
              )}

              {tool.description && (
                <p className="mt-4 leading-relaxed text-slate-600">
                  {tool.description}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <QuickInfoItem
                  icon={<Tag className="h-4 w-4" />}
                  label="Category"
                  value={tool.category.name}
                />
                <QuickInfoItem
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Skill Level"
                  value={formatSkillLevel(tool.skillLevel ?? "")}
                />
                {tool.assetId && (
                  <QuickInfoItem
                    icon={<Hash className="h-4 w-4" />}
                    label="Asset ID"
                    value={tool.assetId}
                  />
                )}
                {tool.replacementCost && (
                  <QuickInfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Value"
                    value={`$${Number(tool.replacementCost).toFixed(0)}`}
                  />
                )}
              </div>
            </div>

            {tool.specifications !== null && tool.specifications !== undefined && (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <ToolSpecifications specifications={tool.specifications as Record<string, string>} />
  </div>
)}

            {tool.accessories.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolAccessories accessories={tool.accessories} />
              </div>
            )}

            {tool.safetyInfo && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolSafetyInfo safetyInfo={tool.safetyInfo} />
              </div>
            )}

            {(tool.userManualUrl || tool.quickStartGuideUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolDocuments
                  userManualUrl={tool.userManualUrl}
                  quickStartGuideUrl={tool.quickStartGuideUrl}
                />
              </div>
            )}

            {tool.location && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Pickup Location
                  </h3>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">
                    {tool.location.name}
                  </p>

                  {tool.location.address && (
                    <p className="mt-1 text-sm text-slate-600">
                      {tool.location.address}
                    </p>
                  )}

                  {(tool.location.city ||
                    tool.location.state ||
                    tool.location.zipCode) && (
                    <p className="text-sm text-slate-600">
                      {[tool.location.city, tool.location.state, tool.location.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4">
                    {tool.location.phone && (
                      <a
                        href={`tel:${tool.location.phone}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="h-4 w-4" />
                        {tool.location.phone}
                      </a>
                    )}
                    {tool.location.email && (
                      <a
                        href={`mailto:${tool.location.email}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        {tool.location.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <ReservationCard
                toolId={tool.id}
                toolName={tool.name}
                toolStatus={tool.status}
                location={tool.location}
                reservations={reservations}
                userId={userId}
              />

              {tool.conditionNotes && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-700">
                    Condition Notes
                  </p>
                  <p className="text-sm text-amber-800">{tool.conditionNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <RelatedTools tools={relatedTools} categoryName={tool.category.name} />
      </div>
    </div>
  );
}

function QuickInfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}