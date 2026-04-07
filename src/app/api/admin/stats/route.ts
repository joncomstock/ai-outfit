import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { productsTable } from "@/db/schema/products";
import { trendsTable } from "@/db/schema/trends";
import { affiliateClicksTable } from "@/db/schema/affiliate";
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

  const [usersResult] = await db.select({ value: count() }).from(usersTable);
  const [productsResult] = await db.select({ value: count() }).from(productsTable);
  const [trendsResult] = await db
    .select({ value: count() })
    .from(trendsTable)
    .where(eq(trendsTable.status, "published"));
  const [clicksResult] = await db.select({ value: count() }).from(affiliateClicksTable);

  return NextResponse.json({
    totalUsers: usersResult?.value ?? 0,
    totalProducts: productsResult?.value ?? 0,
    activeTrends: trendsResult?.value ?? 0,
    totalClicks: clicksResult?.value ?? 0,
  });
}
