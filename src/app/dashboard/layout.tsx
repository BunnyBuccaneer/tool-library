import { getUnreadNotificationCount } from "@/lib/data/member";
import { getDemoUserId } from "@/lib/auth-helpers";
import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let unreadCount = 0;
  try {
    const userId = await getDemoUserId();
    unreadCount = await getUnreadNotificationCount(userId);
  } catch {
    // Demo user may not exist yet — leave count at 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <DashboardShell unreadCount={unreadCount}>{children}</DashboardShell>
    </div>
  );
}