"use client";

import { useRouter } from "next/navigation";
import SaveProjectButton from "@/components/projects/SaveProjectButton";
import type { SavedProject, Project } from "@/db/schema";

interface Props {
  saved: { savedProject: SavedProject; project: Project }[];
}

export default function SavedProjectsClient({ saved }: Props) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {saved.map(({ project }) => (
        <div
          key={project.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
            <SaveProjectButton
              projectId={project.id}
              initialSaved={true}
              onToggle={() => router.refresh()}
            />
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {project.difficulty && (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
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
