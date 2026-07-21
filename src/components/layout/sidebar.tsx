"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wrench,
  MapPin,
  Settings,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Award,
  DollarSign,
  ClipboardCheck,
  AlertCircle,
  HardHat,
  Bell,
  Handshake,
  Package,
  Hammer,
} from "lucide-react";
import { useState } from "react";
import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Parameters<typeof hasPermission>[1];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    label: "Members",
    href: "/admin/members",
    icon: Users,
    permission: "members:view",
  },
  {
    label: "Tools",
    href: "/admin/tools",
    icon: Wrench,
    permission: "tools:view",
  },
  {
    label: "Reservations",
    href: "/admin/reservations",
    icon: CalendarDays,
    permission: "reservations:view_all",
  },
  {
    label: "Rentals",
    href: "/admin/rentals",
    icon: Package,
  },
  {
    label: "Locations",
    href: "/admin/locations",
    icon: MapPin,
    permission: "locations:view",
  },
  {
    label: "Certifications",
    href: "/admin/certifications",
    icon: Award,
  },
  {
    label: "Maintenance",
    href: "/admin/maintenance",
    icon: HardHat,
  },
  {
    label: "Repairs",
    href: "/admin/repairs",
    icon: Hammer,
  },
  {
    label: "Inspections",
    href: "/admin/inspections",
    icon: ClipboardCheck,
  },
  {
    label: "Issues",
    href: "/admin/issues",
    icon: AlertCircle,
  },
  {
    label: "Partners",
    href: "/admin/partners",
    icon: Handshake,
  },
  {
    label: "Finance",
    href: "/admin/finance",
    icon: DollarSign,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    permission: "reports:view",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings:view",
  },
];

interface SidebarProps {
  userRole: Role;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => !item.permission || hasPermission(userRole, item.permission)
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 shrink-0">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              TL
            </div>
            <span className="font-semibold text-gray-900">Tool Library</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}