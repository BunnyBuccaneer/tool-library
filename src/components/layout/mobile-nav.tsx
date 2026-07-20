"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { isAtLeast } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/", label: "Home" },
    ...(session?.user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          ...(isAtLeast(session.user.role as Role, "employee")
            ? [{ href: "/admin", label: "Admin" }]
            : []),
        ]
      : []),
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-gray-200 bg-white px-4 py-4 shadow-lg">
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-gray-200 pt-4">
            {session?.user ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/auth/register">Join Now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
