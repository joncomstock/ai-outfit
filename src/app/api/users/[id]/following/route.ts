import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(clerkId);

  const { id: targetUserId } = await params;

  const following = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      createdAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
    .where(eq(followsTable.followerId, targetUserId));

  return NextResponse.json({ users: following });
}
