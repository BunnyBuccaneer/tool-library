import type { ReactNode } from "react";
import {
  requireAdminAuth,
  getRoleDisplayName,
  getImpersonationInfo,
} from "@/lib/admin-auth";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata = {
  title: "Admin Portal | Tool Rental",
  description: "Administration portal for Tool Rental SaaS",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side admin protection
  // Redirects to /auth/login if not authenticated
  // Redirects to /dashboard if authenticated but not admin
  const user = await requireAdminAuth();
  const roleDisplayName = getRoleDisplayName(user.role);
  const impersonation = await getImpersonationInfo();

  return (
    <AdminShell
      user={user}
      roleDisplayName={roleDisplayName}
      impersonation={impersonation}
    >
      {children}
    </AdminShell>
  );
}