import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/admin-auth";

export const metadata = {
  title: "Dashboard | Tool Rental",
  description: "Your Tool Rental member dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user;

  // Uses role-based access, ADMIN_EMAILS fallback, and database role lookup.
const showAdminLink = await checkIsAdmin(user.email ?? "", user.role ?? "member");
  const quickActions = [
    {
      title: "Browse Tools",
      description: "Explore our inventory of tools available for rental.",
      href: "/tools",
      linkLabel: "View all tools",
      color: "bg-blue-100 text-blue-600",
      icon: (
        <svg
          className="h-6 w-6"
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
      ),
    },
    {
      title: "My Reservations",
      description: "View and manage your current and upcoming reservations.",
      href: "/dashboard/reservations",
      linkLabel: "View reservations",
      color: "bg-green-100 text-green-600",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Favorites",
      description: "Access your saved favorite tools quickly.",
      href: "/dashboard/favorites",
      linkLabel: "View favorites",
      color: "bg-purple-100 text-purple-600",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Tool Rental
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {showAdminLink && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                Admin Portal
              </Link>
            )}

            <span className="hidden text-sm text-slate-600 md:inline">
              {user.email}
            </span>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user.name ?? user.email}!
          </h1>
          <p className="mt-1 text-slate-500">
            Browse tools, make reservations, and manage your account.
          </p>
        </div>

        {showAdminLink && (
          <Link
            href="/admin"
            className="mb-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Open Admin Portal
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <div
              key={action.title}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
                >
                  {action.icon}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {action.title}
                </h2>
              </div>

              <p className="mb-4 text-sm text-slate-500">
                {action.description}
              </p>

              <Link
                href={action.href}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {action.linkLabel} →
              </Link>
            </div>
          ))}
        </div>

        {/* Account Information */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Account Information
          </h2>

          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="text-slate-900">{user.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Name</dt>
              <dd className="text-slate-900">{user.name ?? "Not set"}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">Role</dt>
              <dd className="capitalize text-slate-900">
                {user.role?.replace("_", " ") ?? "Member"}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">User ID</dt>
              <dd className="break-all font-mono text-sm text-slate-500">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}