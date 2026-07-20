import { db } from "@/db";
import {
  projects,
  projectTools,
  tools,
  relatedProjects,
  type Project,
} from "@/db/schema";
import { and, eq, ilike, sql, count } from "drizzle-orm";

// ─── withRetry: handles Neon cold-start / compute wake-ups ─────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < retries)
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GetProjectsParams {
  search?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  page?: number;
  pageSize?: number;
}

export interface ProjectWithRelations extends Project {
  requiredTools: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    status: string;
    skillLevel: string | null;
  }[];
  relatedProjects: {
    id: string;
    name: string;
    slug: string;
    difficulty: string | null;
    estimatedTime: string | null;
  }[];
}

// ─── getProjects ────────────────────────────────────────────────────────────

export async function getProjects(params: GetProjectsParams = {}) {
  const { search, difficulty, page = 1, pageSize = 12 } = params;
  const offset = (page - 1) * pageSize;

  return withRetry(async () => {
    // Build WHERE conditions
    const conditions = [eq(projects.isActive, true)];

    if (search) {
      conditions.push(ilike(projects.name, `%${search}%`));
    }

    if (difficulty) {
      conditions.push(eq(projects.difficulty, difficulty));
    }

    const where = and(...conditions);

    // Run data + count queries in parallel
    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(where)
        .orderBy(projects.createdAt)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: count() })
        .from(projects)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });
}

// ─── getProjectBySlug ───────────────────────────────────────────────────────

export async function getProjectBySlug(
  slug: string
): Promise<ProjectWithRelations | null> {
  return withRetry(async () => {
    // 1. Fetch the project itself
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isActive, true)))
      .limit(1);

    if (!project) return null;

    // 2. Fetch required tools via the project_tools junction
    const requiredTools = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        imageUrl: tools.imageUrl,
        status: tools.status,
        skillLevel: tools.skillLevel,
      })
      .from(projectTools)
      .innerJoin(tools, eq(projectTools.toolId, tools.id))
      .where(eq(projectTools.projectId, project.id));

    // 3. Fetch related projects via the related_projects junction
    const related = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        difficulty: projects.difficulty,
        estimatedTime: projects.estimatedTime,
      })
      .from(relatedProjects)
      .innerJoin(
        projects,
        eq(relatedProjects.relatedProjectId, projects.id)
      )
      .where(
        and(
          eq(relatedProjects.projectId, project.id),
          eq(projects.isActive, true)
        )
      );

    return {
      ...project,
      requiredTools,
      relatedProjects: related,
    };
  });
}
