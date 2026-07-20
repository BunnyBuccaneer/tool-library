import { db } from "@/db";
import { reservations, tools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH — modify reservation dates
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDemoUserId();
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (!["pending", "confirmed"].includes(existing.status)) {
      return Response.json(
        { error: "Can only modify pending or confirmed reservations" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.pickupDate) {
      updates.pickupDate = body.pickupDate;
    }
    if (body.returnDate) {
      updates.returnDate = body.returnDate;
    }
    if (body.pickupTime !== undefined) {
      updates.pickupTime = body.pickupTime;
    }
    if (body.returnTime !== undefined) {
      updates.returnTime = body.returnTime;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    const [updated] = await db
      .update(reservations)
      .set(updates)
      .where(eq(reservations.id, id))
      .returning();

    return Response.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// DELETE — cancel reservation and revert tool status
export async function DELETE(_request: NextRequest, context: RouteContext) {
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

    if (["returned", "cancelled"].includes(existing.status)) {
      return Response.json(
        { error: "Reservation already completed or cancelled" },
        { status: 400 }
      );
    }

    // Cancel the reservation
    await db
      .update(reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservations.id, id));

    // Revert tool status to available
    await db
      .update(tools)
      .set({ status: "available", updatedAt: new Date() })
      .where(eq(tools.id, existing.toolId));

    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
