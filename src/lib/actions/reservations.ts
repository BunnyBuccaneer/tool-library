"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reservations, tools } from "@/db/schema";
import { eq, and, gte, lte, ne, or } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin-auth";
import { checkReservationConflicts } from "@/lib/data/reservations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to24HourTime(time: string | undefined | null): string | null {
  if (!time) return null;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    return time.length === 5 ? `${time}:00` : time;
  }
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateReservationInput {
  toolId: string;
  userId: string;
  locationId?: string;
  pickupDate: string;
  pickupTime?: string;
  returnDate: string;
  returnTime?: string;
  notes?: string;
}

export interface ReservationResult {
  success: boolean;
  error?: string;
  reservationId?: string;
}

// ─── Availability check ───────────────────────────────────────────────────────

export async function checkAvailability(
  toolId: string,
  pickupDate: Date,
  returnDate: Date
): Promise<{ available: boolean; conflicts: number }> {
  const pickupStr = pickupDate.toISOString().split("T")[0];
  const returnStr = returnDate.toISOString().split("T")[0];

  const conflicts = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.toolId, toolId),
        ne(reservations.status, "cancelled"),
        ne(reservations.status, "returned"),
        or(
          and(
            lte(reservations.pickupDate, pickupStr),
            gte(reservations.returnDate, pickupStr)
          ),
          and(
            lte(reservations.pickupDate, returnStr),
            gte(reservations.returnDate, returnStr)
          ),
          and(
            gte(reservations.pickupDate, pickupStr),
            lte(reservations.returnDate, returnStr)
          )
        )
      )
    );

  return {
    available: conflicts.length === 0,
    conflicts: conflicts.length,
  };
}

// ─── Create reservation (user-facing) ─────────────────────────────────────────

export async function createReservation(
  input: CreateReservationInput
): Promise<ReservationResult> {
  try {
    const pickupDate = new Date(input.pickupDate);
    const returnDate = new Date(input.returnDate);

    if (pickupDate >= returnDate) {
      return { success: false, error: "Return date must be after pickup date" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickupDate < today) {
      return { success: false, error: "Pickup date cannot be in the past" };
    }

    const tool = await db
      .select({
        id: tools.id,
        status: tools.status,
        locationId: tools.locationId,
      })
      .from(tools)
      .where(eq(tools.id, input.toolId))
      .limit(1);

    if (tool.length === 0) {
      return { success: false, error: "Tool not found" };
    }

    if (tool[0].status !== "available") {
      return {
        success: false,
        error: "Tool is not available for reservation",
      };
    }

    const { available } = await checkAvailability(
      input.toolId,
      pickupDate,
      returnDate
    );

    if (!available) {
      return {
        success: false,
        error: "Selected dates conflict with existing reservations",
      };
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
        toolId: input.toolId,
        userId: input.userId,
        locationId: input.locationId || tool[0].locationId,
        pickupDate: pickupDate.toISOString().split("T")[0],
        pickupTime: to24HourTime(input.pickupTime),
        returnDate: returnDate.toISOString().split("T")[0],
        returnTime: to24HourTime(input.returnTime),
        notes: input.notes || null,
        status: "pending",
      })
      .returning({ id: reservations.id });

    revalidatePath("/tools");

    return { success: true, reservationId: newReservation.id };
  } catch (error) {
    console.error("createReservation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create reservation. Please try again.",
    };
  }
}

// ─── Cancel own reservation (user-facing) ─────────────────────────────────────

export async function cancelOwnReservation(
  reservationId: string,
  userId: string
): Promise<ReservationResult> {
  try {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId))
      .limit(1);

    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    if (reservation.userId !== userId) {
      return {
        success: false,
        error: "You can only cancel your own reservations",
      };
    }

    if (reservation.status === "cancelled") {
      return { success: false, error: "Reservation is already cancelled" };
    }

    if (reservation.status === "checked_out") {
      return {
        success: false,
        error: "Cannot cancel a checked-out reservation",
      };
    }

    await db
      .update(reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservations.id, reservationId));

    revalidatePath("/tools");

    return { success: true, reservationId };
  } catch (error) {
    console.error("cancelOwnReservation error:", error);
    return {
      success: false,
      error: "Failed to cancel reservation. Please try again.",
    };
  }
}

// ─── Approve reservation (admin) ──────────────────────────────────────────────

export async function approveReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({
        status: reservations.status,
        toolId: reservations.toolId,
        pickupDate: reservations.pickupDate,
        returnDate: reservations.returnDate,
      })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };
    if (res.status !== "pending")
      return {
        success: false,
        error: "Only pending reservations can be approved.",
      };

    const conflicts = await checkReservationConflicts(
      res.toolId,
      res.pickupDate,
      res.returnDate,
      id
    );
    if (conflicts.hasConflict) {
      return {
        success: false,
        error: `Conflict detected with ${conflicts.conflicts.length} other reservation(s).`,
      };
    }

    await db
      .update(reservations)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(reservations.id, id));

    await db
      .update(tools)
      .set({ status: "reserved", updatedAt: new Date() })
      .where(eq(tools.id, res.toolId));

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("approveReservation error:", error);
    return { success: false, error: "Failed to approve reservation." };
  }
}

// ─── Reject reservation (admin) ───────────────────────────────────────────────

export async function rejectReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({ status: reservations.status })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };
    if (res.status !== "pending")
      return {
        success: false,
        error: "Only pending reservations can be rejected.",
      };

    await db
      .update(reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservations.id, id));

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("rejectReservation error:", error);
    return { success: false, error: "Failed to reject reservation." };
  }
}

// ─── Cancel reservation (admin) ───────────────────────────────────────────────

export async function cancelReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({ status: reservations.status, toolId: reservations.toolId })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };

    const cancellable = ["pending", "confirmed"];
    if (!cancellable.includes(res.status))
      return {
        success: false,
        error: "This reservation cannot be cancelled in its current state.",
      };

    await db
      .update(reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(reservations.id, id));

    if (res.status === "confirmed") {
      await db
        .update(tools)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(tools.id, res.toolId));
    }

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("cancelReservation error:", error);
    return { success: false, error: "Failed to cancel reservation." };
  }
}

// ─── Check out tool (admin) ───────────────────────────────────────────────────

export async function checkoutReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({ status: reservations.status, toolId: reservations.toolId })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };
    if (res.status !== "confirmed")
      return {
        success: false,
        error: "Only confirmed reservations can be checked out.",
      };

    await db
      .update(reservations)
      .set({
        status: "checked_out",
        actualPickupDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id));

    await db
      .update(tools)
      .set({ status: "checked_out", updatedAt: new Date() })
      .where(eq(tools.id, res.toolId));

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("checkoutReservation error:", error);
    return { success: false, error: "Failed to check out." };
  }
}

// ─── Return tool (admin) ──────────────────────────────────────────────────────

export async function returnReservation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({ status: reservations.status, toolId: reservations.toolId })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };

    const returnable = ["checked_out", "overdue"];
    if (!returnable.includes(res.status))
      return {
        success: false,
        error: "Only checked-out or overdue reservations can be returned.",
      };

    await db
      .update(reservations)
      .set({
        status: "returned",
        actualReturnDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id));

    await db
      .update(tools)
      .set({ status: "available", updatedAt: new Date() })
      .where(eq(tools.id, res.toolId));

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("returnReservation error:", error);
    return { success: false, error: "Failed to return tool." };
  }
}

// ─── Mark overdue (admin) ─────────────────────────────────────────────────────

export async function markOverdue(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    const [res] = await db
      .select({ status: reservations.status })
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!res) return { success: false, error: "Reservation not found." };
    if (res.status !== "checked_out")
      return {
        success: false,
        error: "Only checked-out reservations can be marked overdue.",
      };

    await db
      .update(reservations)
      .set({ status: "overdue", updatedAt: new Date() })
      .where(eq(reservations.id, id));

    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("markOverdue error:", error);
    return { success: false, error: "Failed to mark as overdue." };
  }
}

// ─── Update reservation notes (admin) ────────────────────────────────────────

export async function updateReservationNotes(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth();

    await db
      .update(reservations)
      .set({ notes, updatedAt: new Date() })
      .where(eq(reservations.id, id));

    revalidatePath(`/admin/reservations/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateReservationNotes error:", error);
    return { success: false, error: "Failed to update notes." };
  }
}
// ─── Create reservation (admin) ───────────────────────────────────────────────

export async function createReservationAsAdmin(
  _prevState: { success: boolean; error: string | null; reservationId?: string },
  formData: FormData
): Promise<{ success: boolean; error: string | null; reservationId?: string }> {
  try {
    await requireAdminAuth();

    const toolId = formData.get("toolId") as string;
    const userId = formData.get("userId") as string;
    const locationId = formData.get("locationId") as string;
    const pickupDate = formData.get("pickupDate") as string;
    const pickupTime = formData.get("pickupTime") as string;
    const returnDate = formData.get("returnDate") as string;
    const returnTime = formData.get("returnTime") as string;
    const notes = formData.get("notes") as string;
    const status = (formData.get("status") as string) || "confirmed";

    if (!toolId || !userId || !pickupDate || !returnDate) {
      return {
        success: false,
        error: "Tool, member, pickup date, and return date are required.",
      };
    }

    if (pickupDate > returnDate) {
      return {
        success: false,
        error: "Return date must be on or after pickup date.",
      };
    }

    const validStatuses = ["pending", "confirmed"];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: "Invalid initial status. Must be pending or confirmed.",
      };
    }

    // Check for conflicts
    const conflicts = await checkReservationConflicts(
      toolId,
      pickupDate,
      returnDate
    );
    if (conflicts.hasConflict) {
      return {
        success: false,
        error: `This tool has ${conflicts.conflicts.length} conflicting reservation(s) in that date range.`,
      };
    }

    // Fetch tool to get default location if not provided
    const [tool] = await db
      .select({
        id: tools.id,
        status: tools.status,
        locationId: tools.locationId,
      })
      .from(tools)
      .where(eq(tools.id, toolId))
      .limit(1);

    if (!tool) {
      return { success: false, error: "Tool not found." };
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
        toolId,
        userId,
        locationId: locationId || tool.locationId,
        pickupDate,
        pickupTime: to24HourTime(pickupTime),
        returnDate,
        returnTime: to24HourTime(returnTime),
        notes: notes || null,
        status: status as "pending" | "confirmed",
      })
      .returning({ id: reservations.id });

    // If admin created as confirmed, mark tool as reserved
    if (status === "confirmed") {
      await db
        .update(tools)
        .set({ status: "reserved", updatedAt: new Date() })
        .where(eq(tools.id, toolId));
    }

    revalidatePath("/admin/reservations");

    return { success: true, error: null, reservationId: newReservation.id };
  } catch (error) {
    console.error("createReservationAsAdmin error:", error);
    return {
      success: false,
      error: "Failed to create reservation. Please try again.",
    };
  }
}