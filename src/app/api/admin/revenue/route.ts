import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function GET(_req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Click counts grouped by provider and date
  const clicks = await db
    .select({
      provider: productsTable.affiliateProvider,
      date: sql<string>`DATE(${affiliateClicksTable.createdAt})`.as("date"),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(affiliateClicksTable)
    .leftJoin(productsTable, eq(affiliateClicksTable.productId, productsTable.id))
    .groupBy(productsTable.affiliateProvider, sql`DATE(${affiliateClicksTable.createdAt})`)
    .orderBy(desc(sql`DATE(${affiliateClicksTable.createdAt})`));

  // Total clicks
  const totalClicks = clicks.reduce((sum, row) => sum + row.count, 0);

  // Clicks by provider
  const byProvider: Record<string, number> = {};
  for (const row of clicks) {
    const provider = row.provider ?? "unknown";
    byProvider[provider] = (byProvider[provider] ?? 0) + row.count;
  }

  return NextResponse.json({
    clicks,
    totalClicks,
    byProvider,
  });
}
