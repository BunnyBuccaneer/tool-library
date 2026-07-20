"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  inspectionTemplates,
  inspectionTemplateItems,
  inspectionRuns,
  inspectionRunItems,
  tools,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Create template ─────────────────────────────────────────────────────────

export async function createTemplate(data: {
  name: string;
  description?: string;
  categoryId?: string;
  triggerType?: "checkout" | "checkin" | "both" | "manual";
  sortOrder?: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminAuth();

    const slug = slugify(data.name);

    const [row] = await db
      .insert(inspectionTemplates)
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        categoryId: data.categoryId ?? null,
        triggerType: data.triggerType ?? "both",
        sortOrder: data.sortOrder ?? 0,
      })
      .returning({ id: inspectionTemplates.id });

    revalidatePath("/admin/inspections");
    return { success: true, id: row.id };
  } catch (error: any) {
    console.error("createTemplate error:", error);
    if (error?.message?.includes("unique")) {
      return { success: false, error: "A template with this name already exists." };
    }
    return { success: false, error: "Failed to create template." };
  }
}

// ─── Update template ─────────────────────────────────────────────────────────

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    categoryId?: string | null;
    triggerType?: "checkout" | "checkin" | "both" | "manual";
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
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    await db
      .update(inspectionTemplates)
      .set(updateData)
      .where(eq(inspectionTemplates.id, id));

    revalidatePath("/admin/inspections");
    revalidatePath(`/admin/inspections/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("updateTemplate error:", error);
    return { success: false, error: "Failed to update template." };
  }
}

// ─── Delete template ─────────────────────────────────────────────────────────

export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .delete(inspectionTemplates)
      .where(eq(inspectionTemplates.id, id));

    revalidatePath("/admin/inspections");
    return { success: true };
  } catch (error) {
    console.error("deleteTemplate error:", error);
    return { success: false, error: "Failed to delete template." };
  }
}

// ─── Add template item ───────────────────────────────────────────────────────

export async function addTemplateItem(data: {
  templateId: string;
  label: string;
  description?: string;
  isCritical?: boolean;
  sortOrder?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(inspectionTemplateItems).values({
      templateId: data.templateId,
      label: data.label,
      description: data.description ?? null,
      isCritical: data.isCritical ?? false,
      sortOrder: data.sortOrder ?? 0,
    });

    revalidatePath(`/admin/inspections/${data.templateId}`);
    return { success: true };
  } catch (error) {
    console.error("addTemplateItem error:", error);
    return { success: false, error: "Failed to add checklist item." };
  }
}

// ─── Remove template item ────────────────────────────────────────────────────

export async function removeTemplateItem(
  itemId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .delete(inspectionTemplateItems)
      .where(eq(inspectionTemplateItems.id, itemId));

    revalidatePath(`/admin/inspections/${templateId}`);
    return { success: true };
  } catch (error) {
    console.error("removeTemplateItem error:", error);
    return { success: false, error: "Failed to remove checklist item." };
  }
}

// ─── Start inspection run ─────────────────────────────────────────────────────

export async function startInspectionRun(data: {
  templateId: string;
  toolId: string;
  reservationId?: string;
  triggerType: "checkout" | "checkin" | "both" | "manual";
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    // Get template items
    const templateItems = await db
      .select()
      .from(inspectionTemplateItems)
      .where(eq(inspectionTemplateItems.templateId, data.templateId))
      .orderBy(inspectionTemplateItems.sortOrder);

    if (templateItems.length === 0) {
      return { success: false, error: "Template has no checklist items." };
    }

    // Create run
    const [run] = await db
      .insert(inspectionRuns)
      .values({
        templateId: data.templateId,
        toolId: data.toolId,
        reservationId: data.reservationId ?? null,
        performedById: admin.id,
        triggerType: data.triggerType,
      })
      .returning({ id: inspectionRuns.id });

    // Create run items
    await db.insert(inspectionRunItems).values(
      templateItems.map((item) => ({
        runId: run.id,
        templateItemId: item.id,
      }))
    );

    revalidatePath("/admin/inspections");
    return { success: true, id: run.id };
  } catch (error) {
    console.error("startInspectionRun error:", error);
    return { success: false, error: "Failed to start inspection." };
  }
}

// ─── Submit inspection run results ────────────────────────────────────────────

export async function submitInspectionResults(
  runId: string,
  data: {
    items: {
      id: string;
      result: "pass" | "fail" | "na" | "skipped";
      notes?: string;
    }[];
    overallNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    // Update each item
    for (const item of data.items) {
      await db
        .update(inspectionRunItems)
        .set({
          result: item.result,
          notes: item.notes ?? null,
        })
        .where(eq(inspectionRunItems.id, item.id));
    }

    // Determine overall status
    const hasFails = data.items.some((i) => i.result === "fail");

    // Check if any critical items failed
    const runItems = await db
      .select({
        result: inspectionRunItems.result,
        isCritical: inspectionTemplateItems.isCritical,
      })
      .from(inspectionRunItems)
      .innerJoin(
        inspectionTemplateItems,
        eq(inspectionRunItems.templateItemId, inspectionTemplateItems.id)
      )
      .where(eq(inspectionRunItems.runId, runId));

    const criticalFail = runItems.some(
      (i) => i.isCritical && i.result === "fail"
    );

    let runStatus: "passed" | "failed" | "flagged";
    let flaggedForRepair = false;

    if (criticalFail) {
      runStatus = "flagged";
      flaggedForRepair = true;
    } else if (hasFails) {
      runStatus = "failed";
    } else {
      runStatus = "passed";
    }

    // Update run
    await db
      .update(inspectionRuns)
      .set({
        status: runStatus,
        notes: data.overallNotes ?? null,
        flaggedForRepair,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inspectionRuns.id, runId));

    // Auto-flag tool for maintenance if critical fail
    if (flaggedForRepair) {
      const [run] = await db
        .select({ toolId: inspectionRuns.toolId })
        .from(inspectionRuns)
        .where(eq(inspectionRuns.id, runId))
        .limit(1);

      if (run) {
        await db
          .update(tools)
          .set({ status: "maintenance", updatedAt: new Date() })
          .where(eq(tools.id, run.toolId));
      }
    }

    revalidatePath("/admin/inspections");
    revalidatePath(`/admin/inspections/${runId}`);
    return { success: true };
  } catch (error) {
    console.error("submitInspectionResults error:", error);
    return { success: false, error: "Failed to submit inspection results." };
  }
}