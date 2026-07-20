import { db } from "@/db";
import { memberProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const userId = await getDemoUserId();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [profile] = await db
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, userId))
      .limit(1);

    return Response.json({ user: user ?? null, profile: profile ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getDemoUserId();
    const body = await request.json();
    const now = new Date();

    // Update user fields
    if (body.name !== undefined || body.email !== undefined) {
      const userUpdates: Record<string, unknown> = { updatedAt: now };
      if (body.name !== undefined) userUpdates.name = body.name;
      if (body.email !== undefined) userUpdates.email = body.email;

      await db
        .update(users)
        .set(userUpdates)
        .where(eq(users.id, userId));
    }

    // Update profile fields
    const profileFields = [
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "preferredLocationId",
    ] as const;

    const profileUpdates: Record<string, unknown> = { updatedAt: now };
    let hasProfileUpdate = false;

    for (const field of profileFields) {
      if (body[field] !== undefined) {
        profileUpdates[field] = body[field] || null;
        hasProfileUpdate = true;
      }
    }

    if (hasProfileUpdate) {
      const [existing] = await db
        .select()
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(memberProfiles)
          .set(profileUpdates)
          .where(eq(memberProfiles.userId, userId));
      }
    }

    // Return updated data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [profile] = await db
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, userId))
      .limit(1);

    return Response.json({ user, profile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
