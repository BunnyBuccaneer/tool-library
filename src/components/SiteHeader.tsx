import Link from "next/link";

export function SiteHeader({ activePage }: { activePage?: "projects" | "tools" | "dashboard" }) {
  const linkClass = (page: string) =>
    activePage === page
      ? "text-sm font-medium text-blue-600"
      : "text-sm font-medium text-slate-600 hover:text-slate-900";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Tool Library
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/projects" className={linkClass("projects")}>
              Projects
            </Link>
            <Link href="/tools" className={linkClass("tools")}>
              Tools
            </Link>
            <Link href="/dashboard" className={linkClass("dashboard")}>
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}