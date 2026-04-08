import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { followsTable } from "@/db/schema/follows";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: targetUserId } = await params;

  if (dbUserId === targetUserId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const [follow] = await db
    .insert(followsTable)
    .values({ followerId: dbUserId, followingId: targetUserId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ followed: follow ?? true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: targetUserId } = await params;

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.followerId, dbUserId),
        eq(followsTable.followingId, targetUserId),
      ),
    );

  return NextResponse.json({ unfollowed: true });
}
