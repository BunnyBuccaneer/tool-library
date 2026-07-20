import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminUser, IMPERSONATION_COOKIE, canImpersonateUser } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  // Verify admin access
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Verify the target user exists and can be impersonated
    const canImpersonate = await canImpersonateUser(userId);
    if (!canImpersonate) {
      return NextResponse.json(
        { error: "Cannot impersonate this user" },
        { status: 403 }
      );
    }

    // Set the impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    return NextResponse.json({ success: true, impersonatedUserId: userId });
  } catch (error) {
    console.error("Impersonation start error:", error);
    return NextResponse.json({ error: "Failed to start impersonation" }, { status: 500 });
  }
}
