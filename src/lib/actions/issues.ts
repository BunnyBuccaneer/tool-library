"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { issues, issueComments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";

// ─── Create issue ─────────────────────────────────────────────────────────────

export async function createIssue(data: {
  toolId?: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  category?: "damage" | "malfunction" | "missing_part" | "safety" | "cosmetic" | "other";
  assignedToId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [row] = await db
      .insert(issues)
      .values({
        toolId: data.toolId ?? null,
        reportedById: admin.id,
        assignedToId: data.assignedToId ?? null,
        priority: data.priority ?? "medium",
        category: data.category ?? "other",
        title: data.title,
        description: data.description ?? null,
        status: data.assignedToId ? "assigned" : "new",
      })
      .returning({ id: issues.id });

    await db.insert(issueComments).values({
      issueId: row.id,
      authorId: admin.id,
      content: `Issue created: ${data.title}`,
      isStatusChange: true,
      oldStatus: null,
      newStatus: data.assignedToId ? "assigned" : "new",
    });

    revalidatePath("/admin/issues");
    return { success: true, id: row.id };
  } catch (error) {
    console.error("createIssue error:", error);
    return { success: false, error: "Failed to create issue." };
  }
}

// ─── Update issue status ──────────────────────────────────────────────────────

export async function updateIssueStatus(
  id: string,
  newStatus: "new" | "triaged" | "assigned" | "in_progress" | "resolved" | "closed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    const [issue] = await db
      .select({ status: issues.status })
      .from(issues)
      .where(eq(issues.id, id))
      .limit(1);

    if (!issue) return { success: false, error: "Issue not found." };

    const oldStatus = issue.status;

    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "resolved") {
      updateData.resolvedAt = new Date();
    }
    if (newStatus === "closed") {
      updateData.closedAt = new Date();
    }

    await db.update(issues).set(updateData).where(eq(issues.id, id));

    await db.insert(issueComments).values({
      issueId: id,
      authorId: admin.id,
      content: `Status changed from ${oldStatus} to ${newStatus}`,
      isStatusChange: true,
      oldStatus,
      newStatus,
    });

    revalidatePath("/admin/issues");
    revalidatePath(`/admin/issues/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateIssueStatus error:", error);
    return { success: false, error: "Failed to update status." };
  }
}

// ─── Update issue details ─────────────────────────────────────────────────────

export async function updateIssueDetails(
  id: string,
  data: {
    assignedToId?: string | null;
    priority?: "low" | "medium" | "high" | "critical";
    category?: "damage" | "malfunction" | "missing_part" | "safety" | "cosmetic" | "other";
    resolution?: string | null;
    repairId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(issues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(issues.id, id));

    revalidatePath(`/admin/issues/${id}`);
    revalidatePath("/admin/issues");
    return { success: true };
  } catch (error) {
    console.error("updateIssueDetails error:", error);
    return { success: false, error: "Failed to update issue." };
  }
}

// ─── Add comment ──────────────────────────────────────────────────────────────

export async function addIssueComment(
  issueId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    await db.insert(issueComments).values({
      issueId,
      authorId: admin.id,
      content,
    });

    revalidatePath(`/admin/issues/${issueId}`);
    return { success: true };
  } catch (error) {
    console.error("addIssueComment error:", error);
    return { success: false, error: "Failed to add comment." };
  }
}

// ─── Link to repair ──────────────────────────────────────────────────────────

export async function linkIssueToRepair(
  issueId: string,
  repairId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdminAuth();

    await db
      .update(issues)
      .set({ repairId, updatedAt: new Date() })
      .where(eq(issues.id, issueId));

    await db.insert(issueComments).values({
      issueId,
      authorId: admin.id,
      content: `Linked to repair ticket`,
      isStatusChange: false,
    });

    revalidatePath(`/admin/issues/${issueId}`);
    return { success: true };
  } catch (error) {
    console.error("linkIssueToRepair error:", error);
    return { success: false, error: "Failed to link repair." };
  }
}

// ─── Unlink repair ────────────────────────────────────────────────────────────

export async function unlinkIssueFromRepair(
  issueId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(issues)
      .set({ repairId: null, updatedAt: new Date() })
      .where(eq(issues.id, issueId));

    revalidatePath(`/admin/issues/${issueId}`);
    return { success: true };
  } catch (error) {
    console.error("unlinkIssueFromRepair error:", error);
    return { success: false, error: "Failed to unlink repair." };
  }
}