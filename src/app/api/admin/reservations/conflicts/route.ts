import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { checkReservationConflicts } from "@/lib/data/reservations";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = request.nextUrl;
    const toolId = searchParams.get("toolId");
    const pickupDate = searchParams.get("pickupDate");
    const returnDate = searchParams.get("returnDate");
    const excludeId = searchParams.get("excludeId") ?? undefined;

    if (!toolId || !pickupDate || !returnDate) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 }
      );
    }

    const result = await checkReservationConflicts(
      toolId,
      pickupDate,
      returnDate,
      excludeId
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { hasConflict: false, conflicts: [] },
      { status: 401 }
    );
  }
}