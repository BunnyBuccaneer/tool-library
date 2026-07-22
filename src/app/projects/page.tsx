import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/db";
import { savedProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { getProjects } from "@/lib/data/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { Pagination } from "@/components/projects/pagination";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    page?: string;
  }>;
}

async function getSavedProjectSet(): Promise<Set<string>> {
  try {
    const userId = await getDemoUserId();
    const rows = await db
      .select({ projectId: savedProjects.projectId })
      .from(savedProjects)
      .where(eq(savedProjects.userId, userId));
    return new Set(rows.map((r) => r.projectId));
  } catch {
    return new Set();
  }
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);

  const [{ data: projects, pagination }, savedSet] = await Promise.all([
    getProjects({
      search: params.search,
      difficulty: params.difficulty,
      page,
      pageSize: 12,
    }),
    getSavedProjectSet(),
  ]);

  const projectsWithSaved = projects.map((p) => ({
    ...p,
    isSaved: savedSet.has(p.id),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader activePage="projects" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Discover DIY Projects
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Browse projects and see exactly what tools you need to complete them.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
            }
          >
            <ProjectFilters />
          </Suspense>
        </div>

        {/* Projects grid */}
        {projectsWithSaved.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projectsWithSaved.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            <Suspense fallback={null}>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
              />
            </Suspense>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 p-3 text-slate-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No projects found
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {params.search || params.difficulty
                ? "Try adjusting your search or filter criteria."
                : "There are no active projects at the moment."}
            </p>
            {(params.search || params.difficulty) && (
              <Link
                href="/projects"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}