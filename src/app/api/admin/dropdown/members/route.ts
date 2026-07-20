import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getMembersForDropdown } from "@/lib/data/certifications";

export async function GET() {
  try {
    await requireAdminAuth();
    const members = await getMembersForDropdown();
    return NextResponse.json(members);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}