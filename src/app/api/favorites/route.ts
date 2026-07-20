import { db } from "@/db";
import { favorites, tools } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDemoUserId } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const userId = await getDemoUserId();
    const rows = await db
      .select({ favorite: favorites, tool: tools })
      .from(favorites)
      .innerJoin(tools, eq(favorites.toolId, tools.id))
      .where(eq(favorites.userId, userId));

    return Response.json(rows);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// POST — toggle favorite (add if not exists, remove if exists)
export async function POST(request: NextRequest) {
  try {
    const userId = await getDemoUserId();
    const { toolId } = await request.json();

    if (!toolId) {
      return Response.json({ error: "toolId is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.toolId, toolId)))
      .limit(1);

    if (existing) {
      await db
        .delete(favorites)
        .where(
          and(eq(favorites.userId, userId), eq(favorites.toolId, toolId))
        );
      return Response.json({ favorited: false });
    }

    await db.insert(favorites).values({ userId, toolId });
    return Response.json({ favorited: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
