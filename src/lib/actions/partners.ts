"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  partners,
  partnerContacts,
  partnerToolLinks,
  partnerRepairLinks,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Create partner ──────────────────────────────────────────────────────────

export async function createPartner(data: {
  name: string;
  type?: "supplier" | "vendor" | "sponsor" | "manufacturer" | "service_provider";
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminAuth();

    const slug = slugify(data.name);

    const [row] = await db
      .insert(partners)
      .values({
        name: data.name,
        slug,
        type: data.type ?? "vendor",
        description: data.description ?? null,
        website: data.website ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zipCode ?? null,
        notes: data.notes ?? null,
      })
      .returning({ id: partners.id });

    revalidatePath("/admin/partners");
    return { success: true, id: row.id };
  } catch (error: any) {
    console.error("createPartner error:", error);
    if (error?.message?.includes("unique")) {
      return { success: false, error: "A partner with this name already exists." };
    }
    return { success: false, error: "Failed to create partner." };
  }
}

// ─── Update partner ──────────────────────────────────────────────────────────

export async function updatePartner(
  id: string,
  data: {
    name?: string;
    type?: "supplier" | "vendor" | "sponsor" | "manufacturer" | "service_provider";
    status?: "active" | "inactive" | "pending";
    description?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) { updateData.name = data.name; updateData.slug = slugify(data.name); }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await db.update(partners).set(updateData).where(eq(partners.id, id));

    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updatePartner error:", error);
    return { success: false, error: "Failed to update partner." };
  }
}

// ─── Delete partner ──────────────────────────────────────────────────────────

export async function deletePartner(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    await db.delete(partners).where(eq(partners.id, id));
    revalidatePath("/admin/partners");
    return { success: true };
  } catch (error) {
    console.error("deletePartner error:", error);
    return { success: false, error: "Failed to delete partner." };
  }
}

// ─── Add contact ──────────────────────────────────────────────────────────────

export async function addPartnerContact(data: {
  partnerId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(partnerContacts).values({
      partnerId: data.partnerId,
      name: data.name,
      title: data.title ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes ?? null,
    });

    revalidatePath(`/admin/partners/${data.partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("addPartnerContact error:", error);
    return { success: false, error: "Failed to add contact." };
  }
}

// ─── Remove contact ──────────────────────────────────────────────────────────

export async function removePartnerContact(
  contactId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    await db.delete(partnerContacts).where(eq(partnerContacts.id, contactId));
    revalidatePath(`/admin/partners/${partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("removePartnerContact error:", error);
    return { success: false, error: "Failed to remove contact." };
  }
}

// ─── Link tool ────────────────────────────────────────────────────────────────

export async function linkPartnerTool(data: {
  partnerId: string;
  toolId: string;
  relationship?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(partnerToolLinks).values({
      partnerId: data.partnerId,
      toolId: data.toolId,
      relationship: data.relationship ?? null,
      notes: data.notes ?? null,
    });

    revalidatePath(`/admin/partners/${data.partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("linkPartnerTool error:", error);
    return { success: false, error: "Failed to link tool." };
  }
}

// ─── Unlink tool ──────────────────────────────────────────────────────────────

export async function unlinkPartnerTool(
  linkId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    await db.delete(partnerToolLinks).where(eq(partnerToolLinks.id, linkId));
    revalidatePath(`/admin/partners/${partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("unlinkPartnerTool error:", error);
    return { success: false, error: "Failed to unlink tool." };
  }
}

// ─── Link repair ──────────────────────────────────────────────────────────────

export async function linkPartnerRepair(data: {
  partnerId: string;
  repairId: string;
  role?: string;
  cost?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(partnerRepairLinks).values({
      partnerId: data.partnerId,
      repairId: data.repairId,
      role: data.role ?? null,
      cost: data.cost ?? null,
      notes: data.notes ?? null,
    });

    revalidatePath(`/admin/partners/${data.partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("linkPartnerRepair error:", error);
    return { success: false, error: "Failed to link repair." };
  }
}

// ─── Unlink repair ────────────────────────────────────────────────────────────

export async function unlinkPartnerRepair(
  linkId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    await db.delete(partnerRepairLinks).where(eq(partnerRepairLinks.id, linkId));
    revalidatePath(`/admin/partners/${partnerId}`);
    return { success: true };
  } catch (error) {
    console.error("unlinkPartnerRepair error:", error);
    return { success: false, error: "Failed to unlink repair." };
  }
}