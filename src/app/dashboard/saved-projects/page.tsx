import { getDemoUserId } from "@/lib/auth-helpers";
import { getSavedProjects } from "@/lib/data/member";
import SavedProjectsClient from "./SavedProjectsClient";

export const dynamic = "force-dynamic";

export default async function SavedProjectsPage() {
  let saved: Awaited<ReturnType<typeof getSavedProjects>> = [];

  try {
    const userId = await getDemoUserId();
    saved = await getSavedProjects(userId);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Saved Projects
      </h1>
      {saved.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No saved projects yet. Browse projects and click Save to bookmark
          them!
        </div>
      ) : (
        <SavedProjectsClient saved={saved} />
      )}
    </div>
  );
}
