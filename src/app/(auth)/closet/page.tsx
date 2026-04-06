import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ClosetPageClient } from "./client";

export default async function ClosetPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!user) return null;

  const items = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, user.id))
    .orderBy(desc(closetItemsTable.createdAt));

  return <ClosetPageClient initialItems={items} />;
}
