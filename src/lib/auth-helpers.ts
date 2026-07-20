import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { type Role, hasPermission, type Permission } from "@/lib/permissions";

const DEMO_EMAIL = "demo@example.com";

/**
 * Get the current authenticated session. Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require a specific permission. Throws if not authorized.
 */
export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!hasPermission(user.role as Role, permission)) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Get the current user's ID. Falls back to the demo user when no session exists
 * (useful while real auth is still being wired up). Throws only if neither exists.
 */
export async function getDemoUserId(): Promise<string> {
  // Prefer the real signed-in user if available
  const sessionUser = await getCurrentUser();
  if (sessionUser?.id) {
    return sessionUser.id;
  }

  // Fall back to the seeded demo user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);

  if (!user) {
    throw new Error(
      `No authenticated user and demo user (${DEMO_EMAIL}) not found. Run the seed script.`
    );
  }

  return user.id;
}