import Link from "next/link";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import type { Project } from "@/db/schema";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-blue-600">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DifficultyBadge difficulty={project.difficulty} size="sm" />
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

      <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
        View project
        <svg
          className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
