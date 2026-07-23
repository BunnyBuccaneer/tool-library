import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

// Only create Resend client if a key is present (avoids crash on missing key)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Always logs the code to the terminal for local development.
 * Also tries Resend if configured — if Resend fails, you still have the console code.
 */
export async function sendVerificationCodeEmail(to: string, code: string) {
  // Always print to terminal — this is your fallback
  console.log("\n========================================");
  console.log("📧 VERIFICATION CODE (console fallback)");
  console.log("========================================");
  console.log(`To:   ${to}`);
  console.log(`Code: ${code}`);
  console.log("========================================\n");

  // Try real email if Resend is configured
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — using console only");
    return { error: null }; // treat as success so registration can continue
  }

  try {
    const result = await resend.emails.send({
      from: `Tool Library <${FROM}>`,
      to,
      subject: "Your verification code",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h1 style="color:#0f172a;">Verify your email</h1>
          <p style="color:#475569;">Enter this code to finish creating your account:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f1f5f9;padding:16px;text-align:center;border-radius:8px;margin:24px 0;color:#0f172a;">
            ${code}
          </div>
          <p style="color:#64748b;font-size:14px;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (result.error) {
      console.warn("[email] Resend failed (using console code instead):", result.error);
      // Still succeed — console has the code
      return { error: null };
    }

    console.log("[email] Resend delivered successfully");
    return { error: null };
  } catch (err) {
    console.warn("[email] Resend threw (using console code instead):", err);
    return { error: null };
  }
}

/**
 * Always logs the reset link to the terminal.
 * Also tries Resend if configured.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  console.log("\n========================================");
  console.log("🔗 PASSWORD RESET LINK (console fallback)");
  console.log("========================================");
  console.log(`To:   ${to}`);
  console.log(`Link: ${resetUrl}`);
  console.log("========================================\n");

  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — using console only");
    return { error: null };
  }

  try {
    const result = await resend.emails.send({
      from: `Tool Library <${FROM}>`,
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h1 style="color:#0f172a;">Reset your password</h1>
          <p style="color:#475569;">Click the button below to set a new password.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Reset Password</a>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.warn("[email] Resend failed (using console link instead):", result.error);
      return { error: null };
    }

    console.log("[email] Resend delivered successfully");
    return { error: null };
  } catch (err) {
    console.warn("[email] Resend threw (using console link instead):", err);
    return { error: null };
  }
}