"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect, useRef } from "react";

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

interface SearchResult {
  tools: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    categoryName: string | null;
  }>;
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  reservations: Array<{
    id: string;
    toolName: string;
    memberEmail: string;
    status: string;
    pickupDate: string;
  }>;
}

interface AdminShellProps {
  user: AdminUser;
  roleDisplayName: string;
  impersonation?: ImpersonationInfo;
  children: ReactNode;
}

// Navigation items for the sidebar
const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Rentals",
    href: "/admin/rentals",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: "Tools",
    href: "/admin/tools",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Reservations",
    href: "/admin/reservations",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: "Maintenance",
    href: "/admin/maintenance",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminShell({
  user,
  roleDisplayName,
  impersonation,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch {
        // Ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleStopImpersonation = async () => {
    try {
      const res = await fetch("/api/admin/impersonation/stop", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Ignore errors
    }
  };

  const totalResults = searchResults
    ? searchResults.tools.length + searchResults.users.length + searchResults.reservations.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Impersonation Banner */}
      {impersonation?.isImpersonating && impersonation.impersonatedUser && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 px-4 py-2">
          <div className="flex items-center justify-center gap-4 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Viewing as: <strong>{impersonation.impersonatedUser.name || impersonation.impersonatedUser.email}</strong>
              {" "}({impersonation.impersonatedUser.role})
            </span>
            <button
              onClick={handleStopImpersonation}
              className="px-3 py-1 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors"
            >
              Stop Impersonating
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white ${impersonation?.isImpersonating ? "pt-10" : ""}`}>
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="text-lg font-semibold">Tool Rental</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-600">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-400 truncate">{roleDisplayName}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Member Portal
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`pl-64 ${impersonation?.isImpersonating ? "pt-10" : ""}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200">
          <div className="flex h-full items-center justify-between px-6">
            {/* Search */}
            <div className="flex-1 max-w-lg" ref={searchRef}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults && setShowResults(true)}
                  placeholder="Search tools, customers, reservations..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showResults && searchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-auto z-50">
                    {totalResults === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No results found for &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <>
                        {searchResults.tools.length > 0 && (
                          <div className="p-2">
                            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                              Tools ({searchResults.tools.length})
                            </div>
                            {searchResults.tools.map((tool) => (
                              <Link
                                key={tool.id}
                                href={`/admin/tools/${tool.id}`}
                                onClick={() => setShowResults(false)}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">{tool.name}</p>
                                  <p className="text-xs text-slate-500">{tool.categoryName || "No category"}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  tool.status === "available" ? "bg-green-100 text-green-700" :
                                  tool.status === "checked_out" ? "bg-blue-100 text-blue-700" :
                                  tool.status === "maintenance" ? "bg-orange-100 text-orange-700" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  {tool.status.replace("_", " ")}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.users.length > 0 && (
                          <div className="p-2 border-t border-slate-100">
                            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                              Customers ({searchResults.users.length})
                            </div>
                            {searchResults.users.map((u) => (
                              <Link
                                key={u.id}
                                href={`/admin/customers?search=${encodeURIComponent(u.email)}`}
                                onClick={() => setShowResults(false)}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-md"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                                  {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">{u.name || u.email}</p>
                                  <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                                <span className="text-xs text-slate-500 capitalize">{u.role.replace("_", " ")}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.reservations.length > 0 && (
                          <div className="p-2 border-t border-slate-100">
                            <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                              Reservations ({searchResults.reservations.length})
                            </div>
                            {searchResults.reservations.map((r) => (
                              <Link
                                key={r.id}
                                href={`/admin/reservations?search=${encodeURIComponent(r.id)}`}
                                onClick={() => setShowResults(false)}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">{r.toolName}</p>
                                  <p className="text-xs text-slate-500">{r.memberEmail} • {r.pickupDate}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  r.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                  r.status === "checked_out" ? "bg-green-100 text-green-700" :
                                  r.status === "returned" ? "bg-slate-100 text-slate-700" :
                                  r.status === "overdue" ? "bg-red-100 text-red-700" :
                                  "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {r.status.replace("_", " ")}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Role badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <span className="text-xs font-medium text-slate-600">{roleDisplayName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
