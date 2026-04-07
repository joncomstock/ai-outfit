import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const trend = await db.query.trends.findFirst({
    where: eq(trendsTable.id, id),
  });

  if (!trend) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      brand: productsTable.brand,
      category: productsTable.category,
      price: productsTable.price,
      currency: productsTable.currency,
      imageUrl: productsTable.imageUrl,
      affiliateUrl: productsTable.affiliateUrl,
    })
    .from(trendProductsTable)
    .innerJoin(productsTable, eq(trendProductsTable.productId, productsTable.id))
    .where(eq(trendProductsTable.trendId, id));

  const saved = await db.query.savedTrends.findFirst({
    where: and(
      eq(savedTrendsTable.userId, dbUserId),
      eq(savedTrendsTable.trendId, id)
    ),
  });

  return NextResponse.json({ trend, products, isSaved: !!saved });
}
