import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { TrendDetailClient } from "./client";
import { notFound } from "next/navigation";

export default async function TrendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const { id } = await params;
  const trend = await db.query.trends.findFirst({
    where: eq(trendsTable.id, id),
  });
  if (!trend) notFound();

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
      eq(savedTrendsTable.userId, userId),
      eq(savedTrendsTable.trendId, id)
    ),
  });

  return (
    <TrendDetailClient
      trend={trend}
      products={products}
      isSaved={!!saved}
    />
  );
}
