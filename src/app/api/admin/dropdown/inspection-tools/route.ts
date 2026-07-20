import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getToolsForInspectionDropdown } from "@/lib/data/inspections";

export async function GET() {
  try {
    await requireAdminAuth();
    const tools = await getToolsForInspectionDropdown();
    return NextResponse.json(tools);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}