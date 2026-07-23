import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, memberProfiles, verificationTokens } from "@/db/schema";
import { registerSchema } from "@/lib/validations/auth";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, code } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Verify the code
    const hashed = hashCode(code);
    const [tokenRow] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, hashed)
        )
      )
      .limit(1);

    if (!tokenRow) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    if (tokenRow.expires < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Request a new one." },
        { status: 400 }
      );
    }

    // Double-check uniqueness (race condition safety)
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        hashedPassword,
        role: "member",
      })
      .returning({ id: users.id, email: users.email });

    await db.insert(memberProfiles).values({
      userId: newUser.id,
      memberNumber: `M-${Date.now()}`,
    });

    // Consume the code
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, normalizedEmail));

    return NextResponse.json(
      { message: "Account created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}