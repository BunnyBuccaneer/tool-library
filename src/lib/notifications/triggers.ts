import { db } from "@/db";
import { notifications, reservations, tools } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getReservationDetails(reservationId: string) {
  const [row] = await db
    .select({
      reservation: reservations,
      toolName: tools.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .where(eq(reservations.id, reservationId))
    .limit(1);
  return row ?? null;
}

export async function notifyUpcomingPickup(
  userId: string,
  reservationId: string
) {
  const details = await getReservationDetails(reservationId);
  if (!details) return;

  await db.insert(notifications).values({
    userId,
    type: "pickup_reminder",
    title: "Upcoming Pickup",
    message: `Your reservation for "${details.toolName}" is scheduled for pickup on ${details.reservation.pickupDate}.`,
  });
}

export async function notifyUpcomingReturn(
  userId: string,
  reservationId: string
) {
  const details = await getReservationDetails(reservationId);
  if (!details) return;

  await db.insert(notifications).values({
    userId,
    type: "return_reminder",
    title: "Return Reminder",
    message: `Please return "${details.toolName}" by ${details.reservation.returnDate}.`,
  });
}

export async function notifyOverdue(userId: string, reservationId: string) {
  const details = await getReservationDetails(reservationId);
  if (!details) return;

  await db.insert(notifications).values({
    userId,
    type: "overdue",
    title: "Overdue Tool",
    message: `"${details.toolName}" was due on ${details.reservation.returnDate}. Please return it as soon as possible.`,
  });
}

export async function notifyReservationConfirmed(
  userId: string,
  reservationId: string
) {
  const details = await getReservationDetails(reservationId);
  if (!details) return;

  await db.insert(notifications).values({
    userId,
    type: "reservation_reminder",
    title: "Reservation Confirmed",
    message: `Your reservation for "${details.toolName}" has been confirmed. Pick up on ${details.reservation.pickupDate}.`,
  });
}

export async function notifyMembershipExpiring(
  userId: string,
  expirationDate: string
) {
  await db.insert(notifications).values({
    userId,
    type: "membership_expiring",
    title: "Membership Expiring Soon",
    message: `Your membership expires on ${expirationDate}. Renew now to keep borrowing tools!`,
  });
}

export async function notifyGeneral(
  userId: string,
  title: string,
  message: string
) {
  await db.insert(notifications).values({
    userId,
    type: "general",
    title,
    message,
  });
}
