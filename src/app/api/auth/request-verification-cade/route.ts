import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomInt, createHash } from "crypto";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
  }

  // Rate limiting is recommended (not shown here)

  // Generate 6-digit code
  const code = String(randomInt(100000, 999999));
  const token = hashToken(code);

  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate old codes for this email (best UX + fewer valid tokens)
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  // TODO: send email using your provider (Resend/Nodemailer/etc)
  // Example placeholder:
  // await sendVerificationEmail(email, code);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}