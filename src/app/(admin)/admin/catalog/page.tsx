import { desc } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { AdminCatalogClient } from "./client";

export default async function AdminCatalogPage() {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.updatedAt))
    .limit(50);

  return <AdminCatalogClient initialProducts={products} />;
}
