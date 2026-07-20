"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  toolMaintenanceRecords,
  maintenanceSchedules,
  maintenanceAssignments,
  tools,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

// ─── Create maintenance record ───────────────────────────────────────────────

export async function createMaintenanceRecord(data: {
  toolId: string;
  maintenanceType: "routine" | "repair" | "inspection" | "calibration" | "cleaning" | "replacement" | "other";
  description: string;
  cost?: string;
  notes?: string;
  nextDueAt?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [row] = await db
      .insert(toolMaintenanceRecords)
      .values({
        toolId: data.toolId,
        performedById: admin.id,
        maintenanceType: data.maintenanceType,
        description: data.description,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
        nextDueAt: data.nextDueAt ? new Date(data.nextDueAt) : null,
      })
      .returning({ id: toolMaintenanceRecords.id });

    revalidatePath("/admin/maintenance");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("createMaintenanceRecord error:", error);
    return { success: false, error: "Failed to create maintenance record." };
  }
}

// ─── Update maintenance record ────────────────────────────────────────────────

export async function updateMaintenanceRecord(
  id: string,
  data: {
    description?: string;
    cost?: string | null;
    notes?: string | null;
    nextDueAt?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextDueAt !== undefined) {
      updateData.nextDueAt = data.nextDueAt ? new Date(data.nextDueAt) : null;
    }

    await db
      .update(toolMaintenanceRecords)
      .set(updateData)
      .where(eq(toolMaintenanceRecords.id, id));

    revalidatePath("/admin/maintenance");
    revalidatePath(`/admin/maintenance/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateMaintenanceRecord error:", error);
    return { success: false, error: "Failed to update record." };
  }
}

// ─── Create schedule ──────────────────────────────────────────────────────────

export async function createSchedule(data: {
  toolId: string;
  maintenanceType: "routine" | "repair" | "inspection" | "calibration" | "cleaning" | "replacement" | "other";
  title: string;
  description?: string;
  intervalDays: number;
  nextDueAt: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [row] = await db
      .insert(maintenanceSchedules)
      .values({
        toolId: data.toolId,
        maintenanceType: data.maintenanceType,
        title: data.title,
        description: data.description ?? null,
        intervalDays: data.intervalDays,
        nextDueAt: new Date(data.nextDueAt),
        createdById: admin.id,
      })
      .returning({ id: maintenanceSchedules.id });

    revalidatePath("/admin/maintenance");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("createSchedule error:", error);
    return { success: false, error: "Failed to create schedule." };
  }
}

// ─── Update schedule ──────────────────────────────────────────────────────────

export async function updateSchedule(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    intervalDays?: number;
    nextDueAt?: string;
    status?: "active" | "paused" | "completed";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.intervalDays !== undefined) updateData.intervalDays = data.intervalDays;
    if (data.nextDueAt !== undefined) updateData.nextDueAt = new Date(data.nextDueAt);
    if (data.status !== undefined) updateData.status = data.status;

    await db
      .update(maintenanceSchedules)
      .set(updateData)
      .where(eq(maintenanceSchedules.id, id));

    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (error) {
    console.error("updateSchedule error:", error);
    return { success: false, error: "Failed to update schedule." };
  }
}

// ─── Complete schedule (mark performed, advance next due) ─────────────────────

export async function completeScheduledMaintenance(
  scheduleId: string,
  data: {
    description: string;
    cost?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [schedule] = await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, scheduleId))
      .limit(1);

    if (!schedule) return { success: false, error: "Schedule not found." };

    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + schedule.intervalDays);

    // Create record
    await db.insert(toolMaintenanceRecords).values({
      toolId: schedule.toolId,
      performedById: admin.id,
      maintenanceType: schedule.maintenanceType,
      description: data.description,
      cost: data.cost ?? null,
      notes: data.notes ?? null,
      nextDueAt: nextDue,
    });

    // Update schedule
    await db
      .update(maintenanceSchedules)
      .set({
        lastPerformedAt: now,
        nextDueAt: nextDue,
        updatedAt: now,
      })
      .where(eq(maintenanceSchedules.id, scheduleId));

    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (error) {
    console.error("completeScheduledMaintenance error:", error);
    return { success: false, error: "Failed to complete maintenance." };
  }
}

// ─── Assign staff ─────────────────────────────────────────────────────────────

export async function assignStaff(data: {
  maintenanceRecordId?: string;
  scheduleId?: string;
  assignedToId: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(maintenanceAssignments).values({
      maintenanceRecordId: data.maintenanceRecordId ?? null,
      scheduleId: data.scheduleId ?? null,
      assignedToId: data.assignedToId,
      notes: data.notes ?? null,
    });

    revalidatePath("/admin/maintenance");
    if (data.maintenanceRecordId) {
      revalidatePath(`/admin/maintenance/${data.maintenanceRecordId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("assignStaff error:", error);
    return { success: false, error: "Failed to assign staff." };
  }
}

// ─── Update assignment status ─────────────────────────────────────────────────

export async function updateAssignmentStatus(
  id: string,
  status: "pending" | "in_progress" | "completed" | "skipped"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "in_progress") updateData.startedAt = new Date();
    if (status === "completed") updateData.completedAt = new Date();

    await db
      .update(maintenanceAssignments)
      .set(updateData)
      .where(eq(maintenanceAssignments.id, id));

    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (error) {
    console.error("updateAssignmentStatus error:", error);
    return { success: false, error: "Failed to update assignment." };
  }
}