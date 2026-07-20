"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import type { Role } from "@/lib/permissions";

interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

interface ImpersonationInfo {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  impersonatedUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface AdminShellProps {
  children: ReactNode;
  user: AdminUser;
  roleDisplayName: string;
  impersonation?: ImpersonationInfo;
}

export function AdminShell({ children, user, roleDisplayName, impersonation }: AdminShellProps) {
  const userRole = user.role as Role;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}