import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug } from "@/lib/data/projects";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { ToolStatusBadge } from "@/components/ui/tool-status-badge";
import { ReserveToolsButton } from "@/components/projects/reserve-tools-button";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface StepOverview {
  step: number;
  title: string;
  description: string;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const safetyNotes = Array.isArray(project.safetyNotes)
    ? (project.safetyNotes as string[])
    : [];

  const stepOverview = Array.isArray(project.stepOverview)
    ? (project.stepOverview as StepOverview[])
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-slate-900">
              Tool Library
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/projects"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Projects
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/projects" className="text-slate-500 hover:text-slate-700">
                Projects
              </Link>
            </li>
            <li className="text-slate-400">/</li>
            <li className="font-medium text-slate-900">{project.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                {project.difficulty && (
                  <DifficultyBadge
                    difficulty={project.difficulty as "beginner" | "intermediate" | "advanced" | "expert"}
                  />
                )}
                {project.estimatedTime && (
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {project.estimatedTime}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-4 text-lg text-slate-600">{project.description}</p>
              )}
            </div>

            {/* Safety notes */}
            {safetyNotes.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h2 className="text-lg font-semibold">Safety Notes</h2>
                </div>
                <ul className="mt-4 space-y-2">
                  {safetyNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step overview */}
            {stepOverview.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Project Steps
                </h2>
                <div className="mt-6 space-y-6">
                  {stepOverview.map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                        {step.step}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-semibold text-slate-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related projects */}
            {project.relatedProjects.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                  Related Projects
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {project.relatedProjects.map((related) => (
                    <Link
                      key={related.id}
                      href={`/projects/${related.slug}`}
                      className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-sm"
                    >
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                        {related.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        {related.difficulty && (
                          <DifficultyBadge
                            difficulty={related.difficulty as "beginner" | "intermediate" | "advanced" | "expert"}
                            size="sm"
                          />
                        )}
                        {related.estimatedTime && (
                          <span className="text-xs text-slate-500">
                            {related.estimatedTime}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required tools */}
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Required Tools
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {project.requiredTools.length} tool
                {project.requiredTools.length !== 1 ? "s" : ""} needed
              </p>

              {project.requiredTools.length > 0 ? (
                <>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {project.requiredTools.map((tool) => (
                      <li key={tool.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">
                              {tool.name}
                            </p>
                            <p className="mt-0.5 text-xs capitalize text-slate-500">
                              {tool.skillLevel?.replace("_", " ") ?? "any"} level
                            </p>
                          </div>
                          <ToolStatusBadge status={tool.status} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <ReserveToolsButton
                      projectId={project.id}
                      projectName={project.name}
                      tools={project.requiredTools}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No specific tools required for this project.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}