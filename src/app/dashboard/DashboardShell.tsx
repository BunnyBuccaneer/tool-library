"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/dashboard/Toast";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/rentals", label: "Current Rentals", icon: "🔧" },
  { href: "/dashboard/reservations", label: "Reservations", icon: "📋" },
  { href: "/dashboard/history", label: "History", icon: "📜" },
  { href: "/dashboard/favorites", label: "Favorite Tools", icon: "❤️" },
  { href: "/dashboard/saved-projects", label: "Saved Projects", icon: "📌" },
  { href: "/dashboard/membership", label: "Membership", icon: "🎫" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardShell({
  children,
  unreadCount,
}: {
  children: ReactNode;
  unreadCount: number;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold text-slate-900">
              🛠️ ToolLib
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/notifications"
                className="relative rounded-lg p-2 hover:bg-slate-100"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/settings"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                👤
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="md:hidden overflow-x-auto border-b border-slate-200 bg-white">
          <div className="flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 ${
                    active
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl">
          {/* Sidebar — hidden on mobile */}
          <nav className="hidden md:block w-56 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-3.5rem)]">
            <ul className="space-y-0.5 p-3">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.label === "Notifications" && unreadCount > 0 && (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
