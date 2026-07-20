"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, memberProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

// ─── Update membership status ─────────────────────────────────────────────────

export async function updateMembershipStatus(
  profileId: string,
  newStatus: "active" | "inactive" | "suspended" | "expired" | "pending"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(memberProfiles)
      .set({
        membershipStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(memberProfiles.id, profileId));

    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("updateMembershipStatus error:", error);
    return { success: false, error: "Failed to update membership status." };
  }
}

// ─── Toggle user active/inactive ──────────────────────────────────────────────

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("toggleUserActive error:", error);
    return { success: false, error: "Failed to toggle user active state." };
  }
}

// ─── Change user role ─────────────────────────────────────────────────────────

export async function changeUserRole(
  userId: string,
  newRole: "super_admin" | "admin" | "manager" | "employee" | "member"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("changeUserRole error:", error);
    return { success: false, error: "Failed to change user role." };
  }
}

// ─── Update member notes ─────────────────────────────────────────────────────

export async function updateMemberNotes(
  profileId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(memberProfiles)
      .set({
        notes,
        updatedAt: new Date(),
      })
      .where(eq(memberProfiles.id, profileId));

    revalidatePath(`/admin/members/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("updateMemberNotes error:", error);
    return { success: false, error: "Failed to update notes." };
  }
}

// ─── Update member profile fields ────────────────────────────────────────────

export async function updateMemberProfile(
  profileId: string,
  data: {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    preferredLocationId?: string | null;
    expirationDate?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(memberProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(memberProfiles.id, profileId));

    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${profileId}`);
    return { success: true };
  } catch (error) {
    console.error("updateMemberProfile error:", error);
    return { success: false, error: "Failed to update member profile." };
  }
}