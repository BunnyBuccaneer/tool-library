import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Always return success — don't leak whether email exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const rawToken = randomBytes(32).toString("hex");
    const hashed = hashToken(rawToken);
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    // Prefix identifier to distinguish reset tokens from signup codes
    const identifier = `pwreset:${normalizedEmail}`;

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    await db.insert(verificationTokens).values({
      identifier,
      token: hashed,
      expires,
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}