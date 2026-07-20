import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await getDemoUserId();
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return Response.json(rows);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// PATCH — mark all as read
export async function PATCH() {
  try {
    const userId = await getDemoUserId();
    const now = new Date();

    await db
      .update(notifications)
      .set({ isRead: true, readAt: now })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
