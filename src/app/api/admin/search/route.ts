import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { universalSearch } from "@/lib/data/admin";

export async function GET(request: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json({
      tools: [],
      users: [],
      reservations: [],
    });
  }

  const results = await universalSearch(query);

  return NextResponse.json(results);
}
