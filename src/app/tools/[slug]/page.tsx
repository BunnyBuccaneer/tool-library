import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getToolBySlug,
  getToolReservations,
  getRelatedTools,
  isFavoritedByUser,
} from "@/lib/data/tools";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/tools/image-gallery";
import { ReservationCard } from "@/components/tools/reservation-card";
import { ToolSpecifications } from "@/components/tools/tool-specifications";
import { ToolSafetyInfo } from "@/components/tools/tool-safety-info";
import { ToolAccessories } from "@/components/tools/tool-accessories";
import { ToolDocuments } from "@/components/tools/tool-documents";
import { RelatedTools } from "@/components/tools/related-tools";
import FavoriteButton from "@/components/tools/FavoriteButton";
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
  try {
    const { slug } = await params;
    const tool = await getToolBySlug(slug);
    if (!tool) return { title: "Tool Not Found | Tool Library" };
    return {
      title: `${tool.name} | Tool Library`,
      description: tool.description || `${tool.name} by ${tool.brand ?? ""}`,
    };
  } catch (error) {
    console.error("[generateMetadata] error:", error);
    return { title: "Tool Library" };
  }
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(`${v}T00:00:00`);
  return new Date(String(v));
}

export default async function ToolDetailPage({ params }: PageProps) {
  let slug: string;

  try {
    ({ slug } = await params);
  } catch (error) {
    console.error("[ToolDetailPage] failed to resolve params:", error);
    notFound();
  }

  let tool: Awaited<ReturnType<typeof getToolBySlug>>;

  try {
    tool = await getToolBySlug(slug!);
  } catch (error) {
    console.error("[ToolDetailPage] getToolBySlug error:", error);
    notFound();
  }

  if (!tool) {
    notFound();
  }

  const startDate = new Date();
  const endDate = addMonths(startDate, 3);

  // ── fetch all data in parallel, never let one failure kill the page ──
  const [reservationsData, relatedToolsRaw, session] = await Promise.all([
    getToolReservations(tool.id, startDate, endDate).catch((err) => {
      console.error("[ToolDetailPage] getToolReservations error:", err);
      return [];
    }),
    getRelatedTools(tool.categoryId ?? "", tool.id, 3).catch((err) => {
      console.error("[ToolDetailPage] getRelatedTools error:", err);
      return [];
    }),
    auth().catch((err) => {
      console.error("[ToolDetailPage] auth error:", err);
      return null;
    }),
  ]);

  const userId = session?.user?.id ?? undefined;

  const initialFavorited =
    userId
      ? await isFavoritedByUser(tool.id, userId).catch(() => false)
      : false;

  // ── safe coercions ──────────────────────────────────────────────────
  const reservations = Array.isArray(reservationsData)
    ? reservationsData.map((r) => ({
        id: r.id,
        pickupDate: toDate(r.pickupDate),
        returnDate: toDate(r.returnDate),
        status: r.status ?? "pending",
      }))
    : [];

  const images = Array.isArray(tool.images) ? tool.images : [];
  const accessories = Array.isArray(tool.accessories) ? tool.accessories : [];
  const safeRelatedTools = Array.isArray(relatedToolsRaw) ? relatedToolsRaw : [];

  // Guard: specifications must be a plain non-null, non-array object
  const rawSpecs = tool.specifications;
  const specifications: Record<string, string> | null =
    rawSpecs !== null &&
    rawSpecs !== undefined &&
    typeof rawSpecs === "object" &&
    !Array.isArray(rawSpecs) &&
    Object.keys(rawSpecs as object).length > 0
      ? (rawSpecs as Record<string, string>)
      : null;

  // Guard: safetyInfo must be a string
  const safetyInfo =
    typeof tool.safetyInfo === "string" && tool.safetyInfo.trim().length > 0
      ? tool.safetyInfo
      : null;

  // Guard: location must be a plain object
  const location =
    tool.location !== null &&
    tool.location !== undefined &&
    typeof tool.location === "object"
      ? tool.location
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ───────────────────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All Tools
          </Link>
          <span className="text-slate-300">/</span>
          {tool.category && (
            <>
              <Link
                href={`/tools?category=${tool.category.slug}`}
                className="text-slate-500 transition-colors hover:text-slate-900"
              >
                {tool.category.name}
              </Link>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="max-w-[200px] truncate font-medium text-slate-900">
            {tool.name}
          </span>
        </nav>

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left / main column ───────────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">

            <ImageGallery
              images={images}
              fallbackImage={tool.imageUrl ?? null}
              toolName={tool.name}
            />

            {/* ── Tool header card ─────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {tool.category && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {tool.category.name}
                  </Badge>
                )}
                {tool.status && (
                  <Badge className={getStatusColor(tool.status)}>
                    {formatStatus(tool.status)}
                  </Badge>
                )}
                {tool.skillLevel && (
                  <Badge className={getSkillLevelColor(tool.skillLevel)}>
                    {formatSkillLevel(tool.skillLevel)}
                  </Badge>
                )}
              </div>

              {tool.assetId && (
                <p className="mb-2 font-mono text-xs text-slate-400">
                  Asset ID: {tool.assetId}
                </p>
              )}

              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {tool.name}
                </h1>
                {userId && (
                  <FavoriteButton
                    toolId={tool.id}
                    initialFavorited={initialFavorited}
                    size="lg"
                  />
                )}
              </div>

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
                {tool.category && (
                  <QuickInfoItem
                    icon={<Tag className="h-4 w-4" />}
                    label="Category"
                    value={tool.category.name}
                  />
                )}
                {tool.skillLevel && (
                  <QuickInfoItem
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Skill Level"
                    value={formatSkillLevel(tool.skillLevel)}
                  />
                )}
                {tool.assetId && (
                  <QuickInfoItem
                    icon={<Hash className="h-4 w-4" />}
                    label="Asset ID"
                    value={tool.assetId}
                  />
                )}
                {tool.replacementCost != null && (
                  <QuickInfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Value"
                    value={`$${Number(tool.replacementCost).toFixed(0)}`}
                  />
                )}
              </div>
            </div>

            {/* ── Specifications ───────────────────────────────── */}
            {specifications && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolSpecifications specifications={specifications} />
              </div>
            )}

            {/* ── Accessories ──────────────────────────────────── */}
            {accessories.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolAccessories accessories={accessories} />
              </div>
            )}

            {/* ── Safety info ──────────────────────────────────── */}
            {safetyInfo && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolSafetyInfo safetyInfo={safetyInfo} />
              </div>
            )}

            {/* ── Documents ────────────────────────────────────── */}
            {(tool.userManualUrl || tool.quickStartGuideUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ToolDocuments
                  userManualUrl={tool.userManualUrl ?? null}
                  quickStartGuideUrl={tool.quickStartGuideUrl ?? null}
                />
              </div>
            )}

            {/* ── Pickup location ──────────────────────────────── */}
            {location && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Pickup Location
                  </h3>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">
                    {location.name}
                  </p>

                  {location.address && (
                    <p className="mt-1 text-sm text-slate-600">
                      {location.address}
                    </p>
                  )}

                  {(location.city || location.state || location.zipCode) && (
                    <p className="text-sm text-slate-600">
                      {[location.city, location.state, location.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4">
                    {location.phone && (
                      <a
                        href={`tel:${location.phone}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="h-4 w-4" />
                        {location.phone}
                      </a>
                    )}
                    {location.email && (
                      <a
                        href={`mailto:${location.email}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        {location.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right / sidebar column ───────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <ReservationCard
                toolId={tool.id}
                toolName={tool.name}
                toolStatus={tool.status ?? "unavailable"}
                location={location}
                reservations={reservations}
                userId={userId}
              />

              {tool.conditionNotes && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-700">
                    Condition Notes
                  </p>
                  <p className="text-sm text-amber-800">
                    {tool.conditionNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related tools ────────────────────────────────────────── */}
        {tool.category && safeRelatedTools.length > 0 && (
          <RelatedTools
            tools={safeRelatedTools}
            categoryName={tool.category.name}
          />
        )}
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