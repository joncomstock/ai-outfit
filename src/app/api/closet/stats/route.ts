import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";

async function getUserId(clerkId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  return user?.id ?? null;
}

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await getUserId(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, dbUserId));

  const totalItems = items.length;
  const readyItems = items.filter((i) => i.status === "ready").length;
  const processingItems = items.filter((i) => i.status === "processing").length;

  const categoryCounts: Record<string, number> = {};
  const colorFrequency: Record<string, number> = {};
  const tagFrequency: Record<string, number> = {};

  for (const item of items) {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
    }
    for (const color of item.colors ?? []) {
      colorFrequency[color] = (colorFrequency[color] ?? 0) + 1;
    }
    for (const tag of item.styleTags ?? []) {
      tagFrequency[tag] = (tagFrequency[tag] ?? 0) + 1;
    }
  }

  const hasMinimumForOutfit =
    (categoryCounts["tops"] ?? 0) >= 1 &&
    (categoryCounts["bottoms"] ?? 0) >= 1 &&
    (categoryCounts["shoes"] ?? 0) >= 1;

  return NextResponse.json({
    totalItems,
    readyItems,
    processingItems,
    categoryCounts,
    colorFrequency,
    tagFrequency,
    outfitReady: hasMinimumForOutfit,
  });
}
