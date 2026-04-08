import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activitiesTable } from "@/db/schema/activities";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { FeedClient } from "./client";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const followedUsers = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, dbUserId));

  const followedIds = followedUsers.map((f) => f.followingId);

  let activities: any[] = [];
  if (followedIds.length > 0) {
    activities = await db
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
      .limit(24);
  }

  return <FeedClient activities={activities} />;
}
