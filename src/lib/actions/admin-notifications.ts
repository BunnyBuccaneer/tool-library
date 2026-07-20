"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  notifications,
  notificationTemplates,
  notificationBatches,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getSegmentUserIds, type Segment } from "@/lib/data/admin-notifications";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Send notification to segment ─────────────────────────────────────────────

export async function sendNotification(data: {
  type: "reservation_reminder" | "pickup_reminder" | "return_reminder" | "overdue" | "membership_expiring" | "general";
  title: string;
  message: string;
  segment: Segment;
  templateId?: string;
}): Promise<{ success: boolean; batchId?: string; recipientCount?: number; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const userIds = await getSegmentUserIds(data.segment);

    if (userIds.length === 0) {
      return { success: false, error: "No recipients found for this segment." };
    }

    // Create batch record
    const [batch] = await db
      .insert(notificationBatches)
      .values({
        templateId: data.templateId ?? null,
        sentById: admin.id,
        type: data.type,
        subject: data.title,
        body: data.message,
        segment: data.segment,
        recipientCount: userIds.length,
        status: "sending",
      })
      .returning({ id: notificationBatches.id });

    // Insert individual notifications
    const notifValues = userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
    }));

    // Insert in chunks of 100
    for (let i = 0; i < notifValues.length; i += 100) {
      const chunk = notifValues.slice(i, i + 100);
      await db.insert(notifications).values(chunk);
    }

    // Mark batch as sent
    await db
      .update(notificationBatches)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(notificationBatches.id, batch.id));

    revalidatePath("/admin/notifications");
    return { success: true, batchId: batch.id, recipientCount: userIds.length };
  } catch (error) {
    console.error("sendNotification error:", error);
    return { success: false, error: "Failed to send notifications." };
  }
}

// ─── Send to single user ─────────────────────────────────────────────────────

export async function sendNotificationToUser(data: {
  userId: string;
  type: "reservation_reminder" | "pickup_reminder" | "return_reminder" | "overdue" | "membership_expiring" | "general";
  title: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
    });

    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
    console.error("sendNotificationToUser error:", error);
    return { success: false, error: "Failed to send notification." };
  }
}

// ─── Create template ─────────────────────────────────────────────────────────

export async function createTemplate(data: {
  name: string;
  type: "reservation_reminder" | "pickup_reminder" | "return_reminder" | "overdue" | "membership_expiring" | "general";
  subject: string;
  body: string;
  variables?: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminAuth();

    const slug = slugify(data.name);

    const [row] = await db
      .insert(notificationTemplates)
      .values({
        name: data.name,
        slug,
        type: data.type,
        subject: data.subject,
        body: data.body,
        variables: data.variables ?? null,
      })
      .returning({ id: notificationTemplates.id });

    revalidatePath("/admin/notifications");
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
    type?: "reservation_reminder" | "pickup_reminder" | "return_reminder" | "overdue" | "membership_expiring" | "general";
    subject?: string;
    body?: string;
    variables?: string[];
    status?: "active" | "inactive";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) { updateData.name = data.name; updateData.slug = slugify(data.name); }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.variables !== undefined) updateData.variables = data.variables;
    if (data.status !== undefined) updateData.status = data.status;

    await db
      .update(notificationTemplates)
      .set(updateData)
      .where(eq(notificationTemplates.id, id));

    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
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
    await db.delete(notificationTemplates).where(eq(notificationTemplates.id, id));
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
    console.error("deleteTemplate error:", error);
    return { success: false, error: "Failed to delete template." };
  }
}

// ─── Delete notification ─────────────────────────────────────────────────────

export async function deleteNotification(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();
    await db.delete(notifications).where(eq(notifications.id, id));
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
    console.error("deleteNotification error:", error);
    return { success: false, error: "Failed to delete notification." };
  }
}