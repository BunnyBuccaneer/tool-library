"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { LogOut, Bell } from "lucide-react";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-sm font-medium text-gray-500">
          Admin Panel
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button className="relative rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {session.user.name}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {ROLE_LABELS[session.user.role as Role] ?? session.user.role}
              </Badge>
            </div>
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
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
