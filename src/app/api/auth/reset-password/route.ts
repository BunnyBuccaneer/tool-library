import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { resetPasswordSchema } from "@/lib/validations/auth";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase() : "";

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success || !email) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error?.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const identifier = `pwreset:${email}`;
    const hashed = hashToken(token);

    const [row] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, hashed)
        )
      )
      .limit(1);

    if (!row || row.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const newHashed = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ hashedPassword: newHashed })
      .where(eq(users.email, email));

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}