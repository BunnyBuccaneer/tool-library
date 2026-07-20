import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, tools } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";

interface BulkReservationItem {
  toolId: string;
  pickupDate: string;   // "YYYY-MM-DD"
  returnDate: string;   // "YYYY-MM-DD"
  pickupTime?: string;  // "HH:MM"
  returnTime?: string;  // "HH:MM"
  locationId?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either { items: [...] } (new) or { toolIds, pickupDate, returnDate } (legacy)
    let items: BulkReservationItem[] = [];

    if (Array.isArray(body.items) && body.items.length > 0) {
      items = body.items;
    } else if (Array.isArray(body.toolIds) && body.toolIds.length > 0) {
      if (!body.pickupDate || !body.returnDate) {
        return NextResponse.json(
          { error: "Pickup and return dates are required" },
          { status: 400 }
        );
      }
      items = body.toolIds.map((toolId: string) => ({
        toolId,
        pickupDate: body.pickupDate,
        returnDate: body.returnDate,
      }));
    } else {
      return NextResponse.json(
        { error: "At least one tool must be selected" },
        { status: 400 }
      );
    }

    // Extract all tool IDs for validation
    const toolIds = items.map((i) => i.toolId);

    // Verify all tools exist
    const selectedTools = await db
      .select({ id: tools.id, name: tools.name, status: tools.status })
      .from(tools)
      .where(inArray(tools.id, toolIds));

    if (selectedTools.length !== toolIds.length) {
      return NextResponse.json(
        { error: "One or more tools not found" },
        { status: 404 }
      );
    }

    // Verify all tools are available
    const unavailableTools = selectedTools.filter(
      (t) => t.status !== "available"
    );
    if (unavailableTools.length > 0) {
      return NextResponse.json(
        {
          error: `The following tools are not available: ${unavailableTools
            .map((t) => t.name)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get the current user (falls back to demo user)
    const userId = await getDemoUserId();

    // Create reservations
    const results = [];
    for (const item of items) {
      const [reservation] = await db
        .insert(reservations)
        .values({
          toolId: item.toolId,
          userId,
          locationId: item.locationId ?? null,
          pickupDate: item.pickupDate,
          returnDate: item.returnDate,
          pickupTime: item.pickupTime ?? null,
          returnTime: item.returnTime ?? null,
          notes: item.notes ?? null,
          status: "pending",
        })
        .returning();

      results.push(reservation);
    }

    // Update tool statuses in a single query
    await db
      .update(tools)
      .set({ status: "reserved", updatedAt: new Date() })
      .where(inArray(tools.id, toolIds));

    return NextResponse.json({
      success: true,
      count: results.length,
      reservations: results,
    });
  } catch (error) {
    console.error("Bulk reservation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create reservations";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}