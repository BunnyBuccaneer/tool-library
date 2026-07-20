import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getReservationById } from "@/lib/data/reservations";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { reservationStatusBadge, toolStatusBadge } from "@/components/admin/status-badge";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
  Hash,
} from "lucide-react";
import { ReservationActions } from "../components/reservation-actions";
import { ConflictChecker } from "../components/conflict-checker";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const res = await getReservationById(id);
  return {
    title: res
      ? `${res.toolName} Reservation | Admin`
      : "Reservation Not Found",
  };
}

export default async function ReservationDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const res = await getReservationById(id);
  if (!res) notFound();

  const isActive = ["pending", "confirmed", "checked_out", "overdue"].includes(
    res.status
  );

  return (
    <div>
      <PageHeader
        title={`Reservation: ${res.toolName}`}
        description={`${res.userName ?? res.userEmail} — ${res.status}`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Reservations", href: "/admin/reservations" },
              { label: res.toolName },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/reservations"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Reservations
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Status</h3>
              {reservationStatusBadge(res.status)}
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Pickup Date"
                value={format(
                  new Date(res.pickupDate + "T00:00:00"),
                  "EEEE, MMMM d, yyyy"
                )}
              />
              {res.pickupTime && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Pickup Time"
                  value={res.pickupTime}
                />
              )}
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Return Date"
                value={format(
                  new Date(res.returnDate + "T00:00:00"),
                  "EEEE, MMMM d, yyyy"
                )}
              />
              {res.returnTime && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Return Time"
                  value={res.returnTime}
                />
              )}
              {res.actualPickupDate && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Actual Pickup"
                  value={format(
                    new Date(res.actualPickupDate),
                    "MMM d, yyyy h:mm a"
                  )}
                />
              )}
              {res.actualReturnDate && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Actual Return"
                  value={format(
                    new Date(res.actualReturnDate),
                    "MMM d, yyyy h:mm a"
                  )}
                />
              )}
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={res.locationName ?? "Not specified"}
              />
            </div>
          </div>

          {/* Member card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Member
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Name"
                value={res.userName ?? "No name"}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={res.userEmail}
              />
              {res.memberNumber && (
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Member #"
                  value={res.memberNumber}
                />
              )}
              {res.memberPhone && (
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={res.memberPhone}
                />
              )}
            </div>
            <div className="mt-3">
              <Link
                href={`/admin/members`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Member Profile →
              </Link>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Notes</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {res.notes || "No notes."}
            </p>
          </div>

          {/* Actions */}
          <ReservationActions
            reservationId={res.id}
            currentStatus={res.status}
            currentNotes={res.notes}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tool card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Tool Details
            </h3>
            <div className="flex gap-6">
              {res.toolImageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={res.toolImageUrl}
                    alt={res.toolName}
                    className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              )}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Name
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {res.toolName}
                  </p>
                </div>
                {res.toolAssetId && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Asset ID
                    </p>
                    <p className="font-mono text-slate-700">{res.toolAssetId}</p>
                  </div>
                )}
                {res.toolBrand && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Brand / Model
                    </p>
                    <p className="text-slate-700">
                      {res.toolBrand}
                      {res.toolModel ? ` ${res.toolModel}` : ""}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Tool Status
                  </p>
                  <div className="mt-1">
                    {toolStatusBadge(res.toolStatus)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Timeline
            </h3>
            <div className="space-y-4">
              <TimelineItem
                label="Reservation Created"
                date={format(new Date(res.createdAt), "MMM d, yyyy h:mm a")}
                active
              />
              {res.status !== "pending" &&
                res.status !== "cancelled" && (
                  <TimelineItem
                    label="Confirmed"
                    date={
                      res.updatedAt
                        ? format(
                            new Date(res.updatedAt),
                            "MMM d, yyyy h:mm a"
                          )
                        : "—"
                    }
                    active={[
                      "confirmed",
                      "checked_out",
                      "returned",
                      "overdue",
                    ].includes(res.status)}
                  />
                )}
              {res.actualPickupDate && (
                <TimelineItem
                  label="Checked Out"
                  date={format(
                    new Date(res.actualPickupDate),
                    "MMM d, yyyy h:mm a"
                  )}
                  active={[
                    "checked_out",
                    "returned",
                    "overdue",
                  ].includes(res.status)}
                />
              )}
              {res.status === "overdue" && (
                <TimelineItem label="Marked Overdue" date="—" active danger />
              )}
              {res.actualReturnDate && (
                <TimelineItem
                  label="Returned"
                  date={format(
                    new Date(res.actualReturnDate),
                    "MMM d, yyyy h:mm a"
                  )}
                  active={res.status === "returned"}
                />
              )}
              {res.status === "cancelled" && (
                <TimelineItem label="Cancelled" date="—" active danger />
              )}
            </div>
          </div>

          {/* Conflict checker */}
          {isActive && (
            <ConflictChecker
              toolId={res.toolId}
              toolName={res.toolName}
              reservationId={res.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
  danger,
}: {
  label: string;
  date: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full border-2 ${
            danger
              ? "border-red-500 bg-red-100"
              : active
                ? "border-blue-500 bg-blue-100"
                : "border-slate-300 bg-slate-100"
          }`}
        />
        <div className="h-full w-px bg-slate-200" />
      </div>
      <div className="pb-4">
        <p
          className={`text-sm font-medium ${
            danger
              ? "text-red-700"
              : active
                ? "text-slate-900"
                : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-slate-500">{date}</p>
      </div>
    </div>
  );
}