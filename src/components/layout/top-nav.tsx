"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { isAtLeast } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export function TopNav() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            TL
          </div>
          <span className="font-semibold text-gray-900 text-lg">
            Tool Library
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Home
          </Link>
          {session?.user && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          )}
          {session?.user &&
            isAtLeast(session.user.role as Role, "employee") && (
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin
              </Link>
            )}
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-600">
                {session.user.name}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name ?? ""}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(session.user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Join Now</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
