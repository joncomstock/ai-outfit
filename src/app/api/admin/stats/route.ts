import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, count, gte, and, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { productsTable } from "@/db/schema/products";
import { trendsTable } from "@/db/schema/trends";
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { outfitsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "all";

  let since: Date | null = null;
  if (range === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (range === "90d") since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [usersResult] = await db.select({ value: count() }).from(usersTable);
  const [productsResult] = await db.select({ value: count() }).from(productsTable);
  const [trendsResult] = await db
    .select({ value: count() })
    .from(trendsTable)
    .where(eq(trendsTable.status, "published"));
  const [clicksResult] = since
    ? await db
        .select({ value: count() })
        .from(affiliateClicksTable)
        .where(gte(affiliateClicksTable.createdAt, since))
    : await db.select({ value: count() }).from(affiliateClicksTable);
  const [outfitsResult] = since
    ? await db
        .select({ value: count() })
        .from(outfitsTable)
        .where(gte(outfitsTable.createdAt, since))
    : await db.select({ value: count() }).from(outfitsTable);
  const [closetItemsResult] = since
    ? await db
        .select({ value: count() })
        .from(closetItemsTable)
        .where(gte(closetItemsTable.createdAt, since))
    : await db.select({ value: count() }).from(closetItemsTable);
  const [sharedResult] = since
    ? await db
        .select({ value: count() })
        .from(outfitsTable)
        .where(
          and(
            isNotNull(outfitsTable.shareToken),
            gte(outfitsTable.createdAt, since)
          )
        )
    : await db
        .select({ value: count() })
        .from(outfitsTable)
        .where(isNotNull(outfitsTable.shareToken));

  return NextResponse.json({
    totalUsers: usersResult?.value ?? 0,
    totalProducts: productsResult?.value ?? 0,
    activeTrends: trendsResult?.value ?? 0,
    totalClicks: clicksResult?.value ?? 0,
    totalOutfits: outfitsResult?.value ?? 0,
    totalClosetItems: closetItemsResult?.value ?? 0,
    sharedOutfits: sharedResult?.value ?? 0,
    range,
  });
}
