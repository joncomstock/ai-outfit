import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";
import { TrendsClient } from "./client";

export default async function TrendsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const trends = await db
    .select()
    .from(trendsTable)
    .where(eq(trendsTable.status, "published"))
    .orderBy(desc(trendsTable.momentumScore));

  return <TrendsClient trends={trends} />;
}
