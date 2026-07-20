import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
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
  ],
  callbacks: {
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

      // Public routes — always accessible
      const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/auth/error",
      ];
      if (publicRoutes.includes(pathname)) return true;

      // API health check
      if (pathname.startsWith("/api/health")) return true;

      // Auth API routes
      if (pathname.startsWith("/api/auth")) return true;

      // All other routes require authentication
      if (!isLoggedIn) return false;

      // Admin routes require admin-level roles (employee and above)
      if (pathname.startsWith("/admin")) {
        return isAdminRole(session.user.role as Role);
      }

      return true;
    },
  },
});