import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDemoUserId();
    const body = await request.json();

    if (!body.newReturnDate) {
      return Response.json(
        { error: "newReturnDate is required" },
        { status: 400 }
      );
    }

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
        { error: "Can only extend checked-out reservations" },
        { status: 400 }
      );
    }

    const newDate = body.newReturnDate as string;
    if (newDate <= existing.returnDate) {
      return Response.json(
        { error: "New return date must be after current return date" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(reservations)
      .set({
        returnDate: newDate,
        returnTime: body.returnTime ?? existing.returnTime,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id))
      .returning();

    return Response.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
