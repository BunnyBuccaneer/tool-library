import { getToolAvailability } from "@/lib/data/availability";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = request.nextUrl;

    // Default to current month if not specified
    const today = new Date();
    const fromDate =
      searchParams.get("from") ??
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const toDateDefault = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    const toDate =
      searchParams.get("to") ??
      `${toDateDefault.getFullYear()}-${String(toDateDefault.getMonth() + 1).padStart(2, "0")}-${String(toDateDefault.getDate()).padStart(2, "0")}`;

    const ranges = await getToolAvailability(id, fromDate, toDate);

    return Response.json({ toolId: id, fromDate, toDate, reservations: ranges });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
