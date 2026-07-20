import { db } from "@/db";
import { savedProjects, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const userId = await getDemoUserId();
    const rows = await db
      .select({ savedProject: savedProjects, project: projects })
      .from(savedProjects)
      .innerJoin(projects, eq(savedProjects.projectId, projects.id))
      .where(eq(savedProjects.userId, userId));

    return Response.json(rows);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDemoUserId();
    const { projectId } = await request.json();

    if (!projectId) {
      return Response.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(savedProjects)
      .where(
        and(
          eq(savedProjects.userId, userId),
          eq(savedProjects.projectId, projectId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(savedProjects)
        .where(
          and(
            eq(savedProjects.userId, userId),
            eq(savedProjects.projectId, projectId)
          )
        );
      return Response.json({ saved: false });
    }

    await db.insert(savedProjects).values({ userId, projectId });
    return Response.json({ saved: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
