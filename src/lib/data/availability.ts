import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

export async function getToolAvailability(
  toolId: string,
  fromDate: string,
  toDate: string
) {
  // Find all reservations that overlap with the requested date range
  const rows = await db
    .select({
      id: reservations.id,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      pickupTime: reservations.pickupTime,
      returnTime: reservations.returnTime,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.toolId, toolId),
        inArray(reservations.status, [
          "pending",
          "confirmed",
          "checked_out",
        ]),
        lte(reservations.pickupDate, toDate),
        gte(reservations.returnDate, fromDate)
      )
    );

  return rows;
}
