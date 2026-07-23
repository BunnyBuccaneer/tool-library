import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || typeof email !== "string" || !code || typeof code !== "string") {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const token = hashToken(code);

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)))
    .limit(1);

  if (!row || row.expires < new Date()) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), { status: 400 });
  }

  // Ensure user exists (1 account per email is enforced by users.email UNIQUE)
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      email,
      // name/hashedPassword/image can be left null/undefined depending on your UI
      role: "member",
      isActive: true,
    });
  } else {
    // Optional: mark active, etc.
    // await db.update(users).set({ isActive: true }).where(eq(users.email, email));
  }

  // Invalidate used token(s)
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

  // TODO: start a session / sign them in (depends on your auth setup)
  // e.g. using NextAuth signIn or your auth() utilities

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}