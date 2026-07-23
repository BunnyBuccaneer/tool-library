import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, memberProfiles } from "@/db/schema";
import { isAdminRole, type Role } from "@/lib/permissions";

// ── Type Augmentation ──────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// ── Auth Configuration ─────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
            role: users.role,
            hashedPassword: users.hashedPassword,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user || !user.hashedPassword || !user.isActive) return null;

        const isValidPassword = await bcrypt.compare(
          password,
          user.hashedPassword
        );
        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, auto-create the user in our DB if they don't exist
      if (account?.provider === "google" && user.email) {
        const normalizedEmail = user.email.toLowerCase();

        const [existing] = await db
          .select({ id: users.id, isActive: users.isActive })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!existing) {
          // Create user + member profile
          const [newUser] = await db
            .insert(users)
            .values({
              name: user.name ?? null,
              email: normalizedEmail,
              image: user.image ?? null,
              role: "member",
              isActive: true,
              // hashedPassword left null — this user only uses Google
            })
            .returning({ id: users.id });

          await db.insert(memberProfiles).values({
            userId: newUser.id,
            memberNumber: `M-${Date.now()}`,
          });

          user.id = newUser.id;
          user.role = "member";
        } else {
          if (!existing.isActive) return false;
          user.id = existing.id;

          // Fetch role from DB (may not be "member")
          const [full] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, existing.id))
            .limit(1);
          user.role = full?.role ?? "member";
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/auth/error",
        "/auth/forgot-password",
        "/auth/reset-password",
      ];
      if (publicRoutes.includes(pathname)) return true;

      if (pathname.startsWith("/api/health")) return true;
      if (pathname.startsWith("/api/auth")) return true;

      if (!isLoggedIn) return false;

      if (pathname.startsWith("/admin")) {
        return isAdminRole(session.user.role as Role);
      }

      return true;
    },
  },
});