import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const userId = await getDemoUserId();
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!prefs) {
      // Return defaults
      return Response.json({
        userId,
        emailNotifications: true,
        reminderDaysBefore: 2,
        preferredLocationId: null,
      });
    }

    return Response.json(prefs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getDemoUserId();
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.emailNotifications !== undefined) {
      updates.emailNotifications = body.emailNotifications;
    }
    if (body.reminderDaysBefore !== undefined) {
      updates.reminderDaysBefore = body.reminderDaysBefore;
    }
    if (body.preferredLocationId !== undefined) {
      updates.preferredLocationId = body.preferredLocationId || null;
    }

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set(updates)
        .where(eq(userPreferences.userId, userId))
        .returning();
      return Response.json(updated);
    }

    const [created] = await db
      .insert(userPreferences)
      .values({
        userId,
        emailNotifications:
          (body.emailNotifications as boolean | undefined) ?? true,
        reminderDaysBefore:
          (body.reminderDaysBefore as number | undefined) ?? 2,
        preferredLocationId: body.preferredLocationId ?? null,
      })
      .returning();

    return Response.json(created);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
