"use client";

import { useRouter } from "next/navigation";
import SaveProjectButton from "@/components/projects/SaveProjectButton";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty: string | null;
  estimatedTime: string | null;
  isSaved: boolean;
}

interface Props {
  projects: ProjectItem[];
}

export default function ProjectsClient({ projects }: Props) {
  const router = useRouter();

  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-orange-100 text-orange-700",
    expert: "bg-red-100 text-red-700",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
            <SaveProjectButton
              projectId={project.id}
              initialSaved={project.isSaved}
              onToggle={() => router.refresh()}
            />
          </div>

          {project.description && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-3">
              {project.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {project.difficulty && (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  difficultyColors[project.difficulty] ??
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {project.difficulty}
              </span>
            )}
            {project.estimatedTime && (
              <span className="text-xs text-slate-400">
                ⏱ {project.estimatedTime}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
