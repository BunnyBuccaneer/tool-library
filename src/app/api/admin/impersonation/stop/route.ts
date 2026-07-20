import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminUser, IMPERSONATION_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  // Verify admin access
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete the impersonation cookie
    const cookieStore = await cookies();
    cookieStore.delete(IMPERSONATION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Impersonation stop error:", error);
    return NextResponse.json({ error: "Failed to stop impersonation" }, { status: 500 });
  }
}
