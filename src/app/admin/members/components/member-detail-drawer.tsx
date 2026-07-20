"use client";

import { useState, useEffect } from "react";
import {
  DetailDrawer,
  DetailField,
  DetailSection,
} from "@/components/admin/detail-drawer";
import {
  memberStatusBadge,
  userRoleBadge,
} from "@/components/admin/status-badge";
import { format } from "date-fns";
import type { MemberListRecord } from "@/lib/data/members";

interface MemberDetailDrawerProps {
  member: MemberListRecord | null;
  open: boolean;
  onClose: () => void;
}

export function MemberDetailDrawer({
  member,
  open,
  onClose,
}: MemberDetailDrawerProps) {
  if (!member) return null;

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={member.name ?? member.email}
      subtitle={`Member #${member.memberNumber}`}
      width="md"
      footer={
        <div className="flex gap-2">
          <a
            href={`/admin/members/${member.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View Full Profile
          </a>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      }
    >
      <DetailSection title="Profile">
        <DetailField label="Name" value={member.name ?? "—"} />
        <DetailField label="Email" value={member.email} />
        <DetailField label="Phone" value={member.phone ?? "—"} />
        <DetailField
          label="Location"
          value={
            [member.city, member.state].filter(Boolean).join(", ") || "—"
          }
        />
        <DetailField
          label="Preferred Location"
          value={member.preferredLocationName ?? "—"}
        />
      </DetailSection>

      <DetailSection title="Membership">
        <DetailField
          label="Status"
          value={memberStatusBadge(member.membershipStatus)}
        />
        <DetailField label="Role" value={userRoleBadge(member.role)} />
        <DetailField
          label="Join Date"
          value={
            member.joinDate
              ? format(
                  new Date(member.joinDate + "T00:00:00"),
                  "MMMM d, yyyy"
                )
              : "—"
          }
        />
        <DetailField
          label="Expiration"
          value={
            member.expirationDate
              ? format(
                  new Date(member.expirationDate + "T00:00:00"),
                  "MMMM d, yyyy"
                )
              : "No expiration"
          }
        />
        <DetailField
          label="Account"
          value={
            <span
              className={
                member.isActive ? "text-green-600" : "text-red-500"
              }
            >
              {member.isActive ? "Active" : "Disabled"}
            </span>
          }
        />
      </DetailSection>

      <DetailSection title="Activity">
        <DetailField
          label="Total Reservations"
          value={String(member.totalReservations)}
        />
        <DetailField
          label="Active Reservations"
          value={String(member.activeReservations)}
        />
        <DetailField
          label="Account Created"
          value={format(new Date(member.createdAt), "MMMM d, yyyy")}
        />
      </DetailSection>
    </DetailDrawer>
  );
}