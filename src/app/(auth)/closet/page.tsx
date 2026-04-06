import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { ClosetPageClient } from "./client";

export default async function ClosetPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const items = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, userId))
    .orderBy(desc(closetItemsTable.createdAt));

  return <ClosetPageClient initialItems={items} />;
}
