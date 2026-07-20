import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getActiveTemplatesForDropdown } from "@/lib/data/inspections";

export async function GET() {
  try {
    await requireAdminAuth();
    const templates = await getActiveTemplatesForDropdown();
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}