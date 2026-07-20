import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getActiveCertTypesForDropdown } from "@/lib/data/certifications";

export async function GET() {
  try {
    await requireAdminAuth();
    const certTypes = await getActiveCertTypesForDropdown();
    return NextResponse.json(certTypes);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}