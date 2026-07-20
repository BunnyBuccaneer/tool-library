import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  type Role,
  isAdminRole,
  getPermissionsForRole,
  type Permission,
} from "@/lib/permissions";

export const IMPERSONATION_COOKIE = "admin_impersonated_user_id";

export const ADMIN_ROLES: Role[] = [
  "super_admin",
  "admin",
  "manager",
  "employee",
];

function getAdminEmailsFromEnv(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(",").map((email) => email.trim().toLowerCase());
}

export async function checkIsAdmin(
  userEmail: string,
  userRole?: string | null
): Promise<boolean> {
  if (userRole && isAdminRole(userRole as Role)) {
    return true;
  }

  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.includes(userEmail.toLowerCase())) {
    return true;
  }

  if (!userRole) {
    const [dbUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, userEmail.toLowerCase()))
      .limit(1);

    if (dbUser?.role && isAdminRole(dbUser.role as Role)) {
      return true;
    }
  }

  return false;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

export async function requireAdminAuth(): Promise<AdminUser> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const { user } = session;
  const email = user.email ?? "";
  const role = user.role ?? "";

  const isAdmin = await checkIsAdmin(email, role);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return {
    id: user.id ?? "",
    email,
    name: user.name,
    image: user.image,
    role,
  };
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const { user } = session;
  const email = user.email ?? "";
  const role = user.role ?? "";

  const isAdmin = await checkIsAdmin(email, role);

  if (!isAdmin) {
    return null;
  }

  return {
    id: user.id ?? "",
    email,
    name: user.name,
    image: user.image,
    role,
  };
}

export function getRoleDisplayName(role: string): string {
  const roleDisplayNames: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    manager: "Manager",
    employee: "Employee",
    member: "Member",
  };
  return roleDisplayNames[role] || role;
}

export function getAdminAccessSource(email: string, role: string): string {
  if (isAdminRole(role as Role)) {
    return `users.role = "${role}"`;
  }

  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.includes(email.toLowerCase())) {
    return "ADMIN_EMAILS environment variable";
  }

  return "Unknown";
}

export function getAdminPermissions(role: string): Permission[] {
  return getPermissionsForRole(role as Role);
}

export interface ImpersonationInfo {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  impersonatedUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export async function getImpersonationInfo(): Promise<ImpersonationInfo> {
  const cookieStore = await cookies();
  const impersonatedUserId =
    cookieStore.get(IMPERSONATION_COOKIE)?.value ?? null;

  if (!impersonatedUserId) {
    return {
      isImpersonating: false,
      impersonatedUserId: null,
      impersonatedUser: null,
    };
  }

  const [impersonatedUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, impersonatedUserId))
    .limit(1);

  if (!impersonatedUser) {
    return {
      isImpersonating: false,
      impersonatedUserId: null,
      impersonatedUser: null,
    };
  }

  return {
    isImpersonating: true,
    impersonatedUserId,
    impersonatedUser,
  };
}

export async function canImpersonateUser(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  if (isAdminRole(user.role as Role)) {
    return false;
  }

  return true;
}