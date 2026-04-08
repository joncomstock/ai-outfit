import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activitiesTable } from "@/db/schema/activities";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24"), 50);

  // Get IDs of users being followed
  const followedUsers = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, dbUserId));

  const followedIds = followedUsers.map((f) => f.followingId);

  if (followedIds.length === 0) {
    return NextResponse.json({ activities: [] });
  }

  // Fetch activities from followed users
  const activities = await db
    .select({
      id: activitiesTable.id,
      userId: activitiesTable.userId,
      type: activitiesTable.type,
      referenceId: activitiesTable.referenceId,
      metadata: activitiesTable.metadata,
      createdAt: activitiesTable.createdAt,
      displayName: usersTable.displayName,
    })
    .from(activitiesTable)
    .innerJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
    .where(inArray(activitiesTable.userId, followedIds))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit);

  return NextResponse.json({ activities });
}
