import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getMemberById, getMemberReservations } from "@/lib/data/members";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import {
  memberStatusBadge,
  userRoleBadge,
} from "@/components/admin/status-badge";
import { format, isValid, parseISO } from "date-fns";
import { Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { MemberActions } from "../components/member-actions";
import { MemberReservations } from "./member-reservations";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Safely format a date value that might be:
 * - null / undefined
 * - a Date object
 * - a full ISO string ("2024-01-15T10:30:00.000Z")
 * - a plain date string ("2024-01-15")
 */
function safeFormatDate(
  input: string | Date | null | undefined,
  fmt: string = "MMM d, yyyy",
  fallback: string = "—"
): string {
  if (!input) return fallback;

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    // If it looks like a plain YYYY-MM-DD, anchor to local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      date = new Date(`${input}T00:00:00`);
    } else {
      // Otherwise parse as ISO
      date = parseISO(input);
      // Fallback to Date constructor if parseISO fails
      if (!isValid(date)) date = new Date(input);
    }
  } else {
    return fallback;
  }

  return isValid(date) ? format(date, fmt) : fallback;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const member = await getMemberById(id);
  return {
    title: member
      ? `${member.name ?? member.email} | Members | Admin`
      : "Member Not Found",
  };
}

export default async function MemberDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const memberReservations = await getMemberReservations(member.userId, 50);

  return (
    <div>
      <PageHeader
        title={member.name ?? member.email}
        description={`Member #${member.memberNumber}`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Members", href: "/admin/members" },
              { label: member.name ?? member.email },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/members"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Members
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {(member.name ?? member.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {member.name ?? "No name"}
                </h2>
                <div className="mt-1 flex flex-wrap gap-2">
                  {memberStatusBadge(member.membershipStatus)}
                  {userRoleBadge(member.role)}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={member.email}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={member.phone ?? "—"}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={
                  [member.address, member.city, member.state, member.zipCode]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Preferred Location"
                value={member.preferredLocationName ?? "—"}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Join Date"
                value={safeFormatDate(member.joinDate)}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Expiration"
                value={safeFormatDate(
                  member.expirationDate,
                  "MMM d, yyyy",
                  "No expiration"
                )}
              />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Account"
                value={member.isActive ? "Active" : "Disabled"}
              />
            </div>
          </div>

          {/* Notes card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Admin Notes
            </h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {member.notes || "No notes."}
            </p>
          </div>

          {/* Reservation stats card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Reservation Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-900">
                  {member.totalReservations}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Active</p>
                <p className="text-xl font-bold text-blue-600">
                  {member.activeReservations}
                </p>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          <MemberActions
            profileId={member.id}
            userId={member.userId}
            currentStatus={member.membershipStatus}
            currentRole={member.role}
            isActive={member.isActive}
            currentNotes={member.notes ?? ""}
          />
        </div>

        {/* Right column: reservations */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Reservation History
            </h3>

            <MemberReservations reservations={memberReservations} />
          </div>
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