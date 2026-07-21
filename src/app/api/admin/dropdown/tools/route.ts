import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/db";
import { tools } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdminAuth();

    const rows = await db
      .select({
        id: tools.id,
        name: tools.name,
        assetId: tools.assetId,
        status: tools.status,
      })
      .from(tools)
      .where(and(eq(tools.isActive, true)))
      .orderBy(asc(tools.name));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}