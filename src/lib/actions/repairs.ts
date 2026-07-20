"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { repairs, repairParts, repairNotes, tools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

// ─── Create repair ───────────────────────────────────────────────────────────

export async function createRepair(data: {
  toolId: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  assignedToId?: string;
  vendorName?: string;
  estimatedCost?: string;
  estimatedCompletion?: string;
  inspectionRunId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [row] = await db
      .insert(repairs)
      .values({
        toolId: data.toolId,
        reportedById: admin.id,
        assignedToId: data.assignedToId ?? null,
        vendorName: data.vendorName ?? null,
        priority: data.priority ?? "medium",
        title: data.title,
        description: data.description ?? null,
        estimatedCost: data.estimatedCost ?? null,
        estimatedCompletion: data.estimatedCompletion ?? null,
        inspectionRunId: data.inspectionRunId ?? null,
      })
      .returning({ id: repairs.id });

    // Set tool to maintenance status
    await db
      .update(tools)
      .set({ status: "maintenance", updatedAt: new Date() })
      .where(eq(tools.id, data.toolId));

    // Add initial note
    await db.insert(repairNotes).values({
      repairId: row.id,
      authorId: admin.id,
      content: `Repair reported: ${data.title}`,
      isStatusChange: true,
      oldStatus: null,
      newStatus: "reported",
    });

    revalidatePath("/admin/repairs");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("createRepair error:", error);
    return { success: false, error: "Failed to create repair." };
  }
}

// ─── Update repair status ─────────────────────────────────────────────────────

export async function updateRepairStatus(
  id: string,
  newStatus: "reported" | "diagnosing" | "in_repair" | "waiting_parts" | "completed" | "unrepairable"
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [repair] = await db
      .select({ status: repairs.status, toolId: repairs.toolId })
      .from(repairs)
      .where(eq(repairs.id, id))
      .limit(1);

    if (!repair) return { success: false, error: "Repair not found." };

    const oldStatus = repair.status;

    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "in_repair" && !repair.status.includes("in_repair")) {
      updateData.startedAt = new Date();
    }

    if (newStatus === "completed" || newStatus === "unrepairable") {
      updateData.completedAt = new Date();
    }

    await db
      .update(repairs)
      .set(updateData)
      .where(eq(repairs.id, id));

    // Update tool status
    if (newStatus === "completed") {
      await db
        .update(tools)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(tools.id, repair.toolId));
    } else if (newStatus === "unrepairable") {
      await db
        .update(tools)
        .set({ status: "retired", updatedAt: new Date() })
        .where(eq(tools.id, repair.toolId));
    }

    // Add status change note
    await db.insert(repairNotes).values({
      repairId: id,
      authorId: admin.id,
      content: `Status changed from ${oldStatus} to ${newStatus}`,
      isStatusChange: true,
      oldStatus,
      newStatus,
    });

    revalidatePath("/admin/repairs");
    revalidatePath(`/admin/repairs/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateRepairStatus error:", error);
    return { success: false, error: "Failed to update status." };
  }
}

// ─── Update repair details ────────────────────────────────────────────────────

export async function updateRepairDetails(
  id: string,
  data: {
    diagnosis?: string;
    resolution?: string;
    assignedToId?: string | null;
    vendorName?: string | null;
    estimatedCost?: string | null;
    actualCost?: string | null;
    estimatedCompletion?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(repairs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(repairs.id, id));

    revalidatePath(`/admin/repairs/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateRepairDetails error:", error);
    return { success: false, error: "Failed to update repair." };
  }
}

// ─── Add note ─────────────────────────────────────────────────────────────────

export async function addRepairNote(
  repairId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    await db.insert(repairNotes).values({
      repairId,
      authorId: admin.id,
      content,
    });

    revalidatePath(`/admin/repairs/${repairId}`);
    return { success: true };
  } catch (error) {
    console.error("addRepairNote error:", error);
    return { success: false, error: "Failed to add note." };
  }
}

// ─── Add part ─────────────────────────────────────────────────────────────────

export async function addRepairPart(data: {
  repairId: string;
  name: string;
  partNumber?: string;
  quantity?: number;
  unitCost?: string;
  vendor?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(repairParts).values({
      repairId: data.repairId,
      name: data.name,
      partNumber: data.partNumber ?? null,
      quantity: data.quantity ?? 1,
      unitCost: data.unitCost ?? null,
      vendor: data.vendor ?? null,
      notes: data.notes ?? null,
    });

    revalidatePath(`/admin/repairs/${data.repairId}`);
    return { success: true };
  } catch (error) {
    console.error("addRepairPart error:", error);
    return { success: false, error: "Failed to add part." };
  }
}

// ─── Update part status ──────────────────────────────────────────────────────

export async function updatePartStatus(
  partId: string,
  repairId: string,
  data: { isOrdered?: boolean; isReceived?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(repairParts)
      .set(data)
      .where(eq(repairParts.id, partId));

    revalidatePath(`/admin/repairs/${repairId}`);
    return { success: true };
  } catch (error) {
    console.error("updatePartStatus error:", error);
    return { success: false, error: "Failed to update part." };
  }
}

// ─── Remove part ──────────────────────────────────────────────────────────────

export async function removeRepairPart(
  partId: string,
  repairId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.delete(repairParts).where(eq(repairParts.id, partId));

    revalidatePath(`/admin/repairs/${repairId}`);
    return { success: true };
  } catch (error) {
    console.error("removeRepairPart error:", error);
    return { success: false, error: "Failed to remove part." };
  }
}