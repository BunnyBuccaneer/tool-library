"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  certificationTypes,
  certificationRequirements,
  memberCertifications,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

// ─── Helper: slugify ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Create certification type ────────────────────────────────────────────────

export async function createCertType(data: {
  name: string;
  description?: string;
  validityMonths?: number;
  isRequired?: boolean;
  sortOrder?: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminAuth();

    const slug = slugify(data.name);

    const [row] = await db
      .insert(certificationTypes)
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        validityMonths: data.validityMonths ?? null,
        isRequired: data.isRequired ?? false,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning({ id: certificationTypes.id });

    revalidatePath("/admin/certifications");
    return { success: true, id: row.id };
  } catch (error: any) {
    console.error("createCertType error:", error);
    if (error?.message?.includes("unique")) {
      return { success: false, error: "A certification type with this name already exists." };
    }
    return { success: false, error: "Failed to create certification type." };
  }
}

// ─── Update certification type ────────────────────────────────────────────────

export async function updateCertType(
  id: string,
  data: {
    name?: string;
    description?: string;
    validityMonths?: number | null;
    isRequired?: boolean;
    status?: "active" | "inactive";
    sortOrder?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.validityMonths !== undefined) updateData.validityMonths = data.validityMonths;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    await db
      .update(certificationTypes)
      .set(updateData)
      .where(eq(certificationTypes.id, id));

    revalidatePath("/admin/certifications");
    revalidatePath(`/admin/certifications/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("updateCertType error:", error);
    if (error?.message?.includes("unique")) {
      return { success: false, error: "A certification type with this name already exists." };
    }
    return { success: false, error: "Failed to update certification type." };
  }
}

// ─── Delete certification type ────────────────────────────────────────────────

export async function deleteCertType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .delete(certificationTypes)
      .where(eq(certificationTypes.id, id));

    revalidatePath("/admin/certifications");
    return { success: true };
  } catch (error) {
    console.error("deleteCertType error:", error);
    return { success: false, error: "Failed to delete certification type." };
  }
}

// ─── Add requirement (category or tool) ───────────────────────────────────────

export async function addCertRequirement(data: {
  certificationTypeId: string;
  categoryId?: string;
  toolId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    if (!data.categoryId && !data.toolId) {
      return { success: false, error: "Must specify a category or tool." };
    }
    if (data.categoryId && data.toolId) {
      return { success: false, error: "Specify either a category or a tool, not both." };
    }

    await db.insert(certificationRequirements).values({
      certificationTypeId: data.certificationTypeId,
      categoryId: data.categoryId ?? null,
      toolId: data.toolId ?? null,
    });

    revalidatePath(`/admin/certifications/${data.certificationTypeId}`);
    return { success: true };
  } catch (error) {
    console.error("addCertRequirement error:", error);
    return { success: false, error: "Failed to add requirement." };
  }
}

// ─── Remove requirement ──────────────────────────────────────────────────────

export async function removeCertRequirement(
  id: string,
  certTypeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .delete(certificationRequirements)
      .where(eq(certificationRequirements.id, id));

    revalidatePath(`/admin/certifications/${certTypeId}`);
    return { success: true };
  } catch (error) {
    console.error("removeCertRequirement error:", error);
    return { success: false, error: "Failed to remove requirement." };
  }
}

// ─── Assign certification to member ───────────────────────────────────────────

export async function assignMemberCert(data: {
  userId: string;
  certificationTypeId: string;
  status?: "valid" | "expired" | "revoked" | "pending";
  issuedDate?: string;
  expiryDate?: string;
  certificateNumber?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [row] = await db
      .insert(memberCertifications)
      .values({
        userId: data.userId,
        certificationTypeId: data.certificationTypeId,
        status: data.status ?? "pending",
        issuedDate: data.issuedDate ?? null,
        expiryDate: data.expiryDate ?? null,
        issuedById: admin.id,
        certificateNumber: data.certificateNumber ?? null,
        notes: data.notes ?? null,
      })
      .returning({ id: memberCertifications.id });

    revalidatePath("/admin/certifications");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("assignMemberCert error:", error);
    return { success: false, error: "Failed to assign certification." };
  }
}

// ─── Update member certification ──────────────────────────────────────────────

export async function updateMemberCert(
  id: string,
  data: {
    status?: "valid" | "expired" | "revoked" | "pending";
    issuedDate?: string | null;
    expiryDate?: string | null;
    certificateNumber?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(memberCertifications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(memberCertifications.id, id));

    revalidatePath("/admin/certifications");
    return { success: true };
  } catch (error) {
    console.error("updateMemberCert error:", error);
    return { success: false, error: "Failed to update certification." };
  }
}

// ─── Revoke member certification ──────────────────────────────────────────────

export async function revokeMemberCert(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(memberCertifications)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(memberCertifications.id, id));

    revalidatePath("/admin/certifications");
    return { success: true };
  } catch (error) {
    console.error("revokeMemberCert error:", error);
    return { success: false, error: "Failed to revoke certification." };
  }
}

// ─── Delete member certification ──────────────────────────────────────────────

export async function deleteMemberCert(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .delete(memberCertifications)
      .where(eq(memberCertifications.id, id));

    revalidatePath("/admin/certifications");
    return { success: true };
  } catch (error) {
    console.error("deleteMemberCert error:", error);
    return { success: false, error: "Failed to delete certification." };
  }
}