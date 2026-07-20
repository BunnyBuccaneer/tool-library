import { db } from "@/db";
import { reservations, tools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDemoUserId();

    const [existing] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (existing.status !== "checked_out") {
      return Response.json(
        { error: "Can only return checked-out items" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Mark reservation as returned
    await db
      .update(reservations)
      .set({
        status: "returned",
        actualReturnDate: now,
        updatedAt: now,
      })
      .where(eq(reservations.id, id));

    // Revert tool status
    await db
      .update(tools)
      .set({ status: "available", updatedAt: now })
      .where(eq(tools.id, existing.toolId));

    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
