import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const email = "demo@example.com";
  const newPassword = "Demo1234!";

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await db
    .update(users)
    .set({
      hashedPassword,
      role: "admin",
      isActive: true,
    })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (result.length === 0) {
    console.log("❌ No user found with email:", email);
  } else {
    console.log("✅ Password reset successfully!");
    console.log("Email:", email);
    console.log("Password:", newPassword);
    console.log("Role:", result[0].role);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});