import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const conditions = [eq(trendsTable.status, "published")];
  if (category) conditions.push(eq(trendsTable.category, category as any));

  const trends = await db
    .select()
    .from(trendsTable)
    .where(and(...conditions))
    .orderBy(desc(trendsTable.momentumScore));

  return NextResponse.json({ trends });
}
