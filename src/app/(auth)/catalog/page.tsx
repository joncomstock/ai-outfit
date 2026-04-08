import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CatalogClient } from "./client";

export const metadata: Metadata = {
  title: "The Digital Curator",
  description:
    "Discover curated fashion products that complement your wardrobe.",
};

export default async function CatalogPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.inStock, 1))
    .orderBy(desc(productsTable.createdAt))
    .limit(48);

  const brandsResult = await db
    .selectDistinct({ brand: productsTable.brand })
    .from(productsTable);
  const brands = brandsResult.map((r) => r.brand);

  return <CatalogClient initialProducts={products} brands={brands} />;
}
