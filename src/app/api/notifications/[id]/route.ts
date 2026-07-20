import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH — mark single notification as read
export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDemoUserId();

    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();

    return Response.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove notification
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDemoUserId();

    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await db.delete(notifications).where(eq(notifications.id, id));
    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
