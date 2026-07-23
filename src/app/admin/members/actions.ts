"use server";

import { db } from "@/db";
import { memberProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/admin-auth";

interface UpdateMemberParams {
  profileId: string;
  userId: string;
  status: "active" | "pending" | "suspended" | "expired";
  role?: "member" | "staff" | "admin";
  isActive?: boolean;
  noteReason: string;
  currentNotes?: string;
}

export async function updateMemberStatus({
  profileId,
  userId,
  status,
  role,
  isActive,
  noteReason,
  currentNotes = "",
}: UpdateMemberParams) {
  await requireAdminAuth();

  if (!noteReason?.trim()) {
    return { success: false, error: "A note or reason is required for status changes." };
  }

  const today = new Date().toISOString().split("T")[0];
  const newEntry = `[${today}] Status set to "${status.toUpperCase()}": ${noteReason.trim()}`;
  const updatedNotes = currentNotes.trim()
    ? `${newEntry}\n${currentNotes.trim()}`
    : newEntry;

  try {
    // 1. Update member profile table (status + notes)
    await db
      .update(memberProfiles)
      .set({
        membershipStatus: status,
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(memberProfiles.id, profileId));

    // 2. Update user table (role + isActive if provided)
    if (role !== undefined || isActive !== undefined) {
      const userUpdates: Record<string, any> = { updatedAt: new Date() };
      if (role !== undefined) userUpdates.role = role;
      if (isActive !== undefined) userUpdates.isActive = isActive;

      await db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${profileId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update member status:", error);
    return { success: false, error: error.message || "Failed to update member status." };
  }
}