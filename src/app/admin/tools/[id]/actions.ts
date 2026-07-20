"use server";

import { db } from "@/db";
import { toolMaintenanceRecords, tools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Maintenance record action state
interface MaintenanceActionState {
  success: boolean;
  error: string | null;
}

export async function addMaintenanceRecord(
  _prevState: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  try {
    const toolId = formData.get("toolId") as string;
    const performedById = formData.get("performedById") as string;
    const maintenanceType = formData.get("maintenanceType") as string;
    const description = formData.get("description") as string;
    const costStr = formData.get("cost") as string;
    const performedAtStr = formData.get("performedAt") as string;
    const nextDueAtStr = formData.get("nextDueAt") as string;
    const notes = formData.get("notes") as string;

    if (!toolId || !maintenanceType || !description || !performedAtStr) {
      return {
        success: false,
        error: "Please fill in all required fields.",
      };
    }

    // Validate maintenance type
    const validTypes = ["routine", "repair", "inspection", "calibration", "cleaning", "replacement", "other"];
    if (!validTypes.includes(maintenanceType)) {
      return {
        success: false,
        error: "Invalid maintenance type.",
      };
    }

    await db.insert(toolMaintenanceRecords).values({
      toolId,
      performedById: performedById || null,
      maintenanceType: maintenanceType as "routine" | "repair" | "inspection" | "calibration" | "cleaning" | "replacement" | "other",
      description,
      cost: costStr ? costStr : null,
      performedAt: new Date(performedAtStr),
      nextDueAt: nextDueAtStr ? new Date(nextDueAtStr) : null,
      notes: notes || null,
    });

    revalidatePath(`/admin/tools/${toolId}`);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    return {
      success: false,
      error: "Failed to add maintenance record. Please try again.",
    };
  }
}

// Tool update action state
interface UpdateToolActionState {
  success: boolean;
  error: string | null;
}

export async function updateTool(
  _prevState: UpdateToolActionState,
  formData: FormData
): Promise<UpdateToolActionState> {
  try {
    const id = formData.get("id") as string;
    const assetId = formData.get("assetId") as string;
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const categoryId = formData.get("categoryId") as string;
    const locationId = formData.get("locationId") as string;
    const status = formData.get("status") as string;
    const skillLevel = formData.get("skillLevel") as string;
    const replacementCost = formData.get("replacementCost") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const conditionNotes = formData.get("conditionNotes") as string;
    const specificationsStr = formData.get("specifications") as string;
    const safetyInfo = formData.get("safetyInfo") as string;
    const userManualUrl = formData.get("userManualUrl") as string;
    const quickStartGuideUrl = formData.get("quickStartGuideUrl") as string;
    const isActive = formData.get("isActive") === "true";

    if (!id || !name || !slug) {
      return {
        success: false,
        error: "Name and slug are required.",
      };
    }

    // Validate status
    const validStatuses = ["available", "checked_out", "reserved", "maintenance", "retired"];
    if (status && !validStatuses.includes(status)) {
      return {
        success: false,
        error: "Invalid status.",
      };
    }

    // Validate skill level
    const validSkillLevels = ["beginner", "intermediate", "advanced", "expert", ""];
    if (skillLevel && !validSkillLevels.includes(skillLevel)) {
      return {
        success: false,
        error: "Invalid skill level.",
      };
    }

    // Parse specifications JSON
    let specifications = null;
    if (specificationsStr) {
      try {
        specifications = JSON.parse(specificationsStr);
      } catch {
        return {
          success: false,
          error: "Invalid specifications JSON format.",
        };
      }
    }

    await db
      .update(tools)
      .set({
        assetId: assetId || null,
        name,
        slug,
        description: description || null,
        brand: brand || null,
        model: model || null,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        locationId: locationId || null,
        status: (status as "available" | "checked_out" | "reserved" | "maintenance" | "retired") || "available",
        skillLevel: (skillLevel as "beginner" | "intermediate" | "advanced" | "expert") || null,
        replacementCost: replacementCost || null,
        serialNumber: serialNumber || null,
        conditionNotes: conditionNotes || null,
        specifications,
        safetyInfo: safetyInfo || null,
        userManualUrl: userManualUrl || null,
        quickStartGuideUrl: quickStartGuideUrl || null,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(tools.id, id));

    revalidatePath(`/admin/tools/${id}`);
    revalidatePath("/admin/tools");
  } catch (error) {
    console.error("Error updating tool:", error);
    return {
      success: false,
      error: "Failed to update tool. Please try again.",
    };
  }

  // Redirect after successful update (must be outside try-catch)
  const id = formData.get("id") as string;
  redirect(`/admin/tools/${id}`);
}
// ── Create Tool ────────────────────────────────────────────────────────

interface CreateToolActionState {
  success: boolean;
  error: string | null;
}

export async function createTool(
  _prevState: CreateToolActionState,
  formData: FormData
): Promise<CreateToolActionState> {
  let newToolId: string | null = null;

  try {
    const assetId = formData.get("assetId") as string;
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const categoryId = formData.get("categoryId") as string;
    const locationId = formData.get("locationId") as string;
    const status = formData.get("status") as string;
    const skillLevel = formData.get("skillLevel") as string;
    const replacementCost = formData.get("replacementCost") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const conditionNotes = formData.get("conditionNotes") as string;
    const specificationsStr = formData.get("specifications") as string;
    const safetyInfo = formData.get("safetyInfo") as string;
    const userManualUrl = formData.get("userManualUrl") as string;
    const quickStartGuideUrl = formData.get("quickStartGuideUrl") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name || !slug) {
      return {
        success: false,
        error: "Name and slug are required.",
      };
    }

    const validStatuses = ["available", "checked_out", "reserved", "maintenance", "retired"];
    if (status && !validStatuses.includes(status)) {
      return {
        success: false,
        error: "Invalid status.",
      };
    }

    const validSkillLevels = ["beginner", "intermediate", "advanced", "expert", ""];
    if (skillLevel && !validSkillLevels.includes(skillLevel)) {
      return {
        success: false,
        error: "Invalid skill level.",
      };
    }

    let specifications = null;
    if (specificationsStr) {
      try {
        specifications = JSON.parse(specificationsStr);
      } catch {
        return {
          success: false,
          error: "Invalid specifications JSON format.",
        };
      }
    }

    const inserted = await db
      .insert(tools)
      .values({
        assetId: assetId || null,
        name,
        slug,
        description: description || null,
        brand: brand || null,
        model: model || null,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        locationId: locationId || null,
        status: (status as "available" | "checked_out" | "reserved" | "maintenance" | "retired") || "available",
        skillLevel: (skillLevel as "beginner" | "intermediate" | "advanced" | "expert") || null,
        replacementCost: replacementCost || null,
        serialNumber: serialNumber || null,
        conditionNotes: conditionNotes || null,
        specifications,
        safetyInfo: safetyInfo || null,
        userManualUrl: userManualUrl || null,
        quickStartGuideUrl: quickStartGuideUrl || null,
        isActive,
      })
      .returning({ id: tools.id });

    newToolId = inserted[0]?.id ?? null;

    revalidatePath("/admin/tools");
  } catch (error) {
    console.error("Error creating tool:", error);
    return {
      success: false,
      error: "Failed to create tool. It's possible the slug or asset ID already exists.",
    };
  }

  if (newToolId) {
    redirect(`/admin/tools/${newToolId}`);
  }

  return { success: true, error: null };
}