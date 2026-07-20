import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getToolsForMaintenanceDropdown } from "@/lib/data/maintenance";

export async function GET() {
  try {
    await requireAdminAuth();
    const tools = await getToolsForMaintenanceDropdown();
    return NextResponse.json(tools);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}