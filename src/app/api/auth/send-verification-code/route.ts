import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomInt, createHash } from "crypto";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendVerificationCodeEmail } from "@/lib/email";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, normalizedEmail));

    const expires = new Date(Date.now() + 10 * 60 * 1000);
    let code: string | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const hashed = hashCode(candidate);
      try {
        await db.insert(verificationTokens).values({
          identifier: normalizedEmail,
          token: hashed,
          expires,
        });
        code = candidate;
        break;
      } catch {
        continue;
      }
    }

    if (!code) {
      return NextResponse.json(
        { error: "Could not generate a unique code. Please try again." },
        { status: 500 }
      );
    }

    // Console fallback always succeeds; Resend is best-effort
    await sendVerificationCodeEmail(normalizedEmail, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-verification-code error:", err);
    return NextResponse.json(
      { error: "Failed to send code" },
      { status: 500 }
    );
  }
}