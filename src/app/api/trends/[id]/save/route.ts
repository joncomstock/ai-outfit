import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedTrendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const [saved] = await db
    .insert(savedTrendsTable)
    .values({ userId: dbUserId, trendId: id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ saved: saved ?? true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  await db
    .delete(savedTrendsTable)
    .where(
      and(
        eq(savedTrendsTable.userId, dbUserId),
        eq(savedTrendsTable.trendId, id)
      )
    );

  return NextResponse.json({ removed: true });
}
