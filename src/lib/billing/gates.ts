import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { usageTrackingTable } from "@/db/schema/usage";

const FREE_GENERATION_LIMIT = 5;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function isPremium(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });
  return user?.subscriptionStatus === "premium";
}

export async function canGenerate(userId: string): Promise<boolean> {
  const premium = await isPremium(userId);
  if (premium) return true;

  const month = getCurrentMonth();
  const usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(usageTrackingTable.userId, userId),
      eq(usageTrackingTable.action, "outfit_generation"),
      eq(usageTrackingTable.month, month),
    ),
  });

  const currentCount = usage?.count ?? 0;
  return currentCount < FREE_GENERATION_LIMIT;
}

export async function getUsage(userId: string): Promise<{
  generationsUsed: number;
  generationsLimit: number;
  isPremium: boolean;
}> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });

  const premium = user?.subscriptionStatus === "premium";
  const month = getCurrentMonth();

  const usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(usageTrackingTable.userId, userId),
      eq(usageTrackingTable.action, "outfit_generation"),
      eq(usageTrackingTable.month, month),
    ),
  });

  return {
    generationsUsed: usage?.count ?? 0,
    generationsLimit: premium ? Infinity : FREE_GENERATION_LIMIT,
    isPremium: premium,
  };
}

export async function recordUsage(userId: string, action: string) {
  const month = getCurrentMonth();

  await db
    .insert(usageTrackingTable)
    .values({ userId, action, month, count: 1 })
    .onConflictDoUpdate({
      target: [
        usageTrackingTable.userId,
        usageTrackingTable.action,
        usageTrackingTable.month,
      ],
      set: {
        count: sql`${usageTrackingTable.count} + 1`,
      },
    });
}
