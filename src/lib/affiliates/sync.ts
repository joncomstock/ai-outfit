import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import type { AffiliateProvider, AffiliateProduct } from "./types";

interface SyncResult {
  provider: string;
  synced: number;
  errors: number;
}

function mapToProductInsert(product: AffiliateProduct, providerName: string) {
  return {
    name: product.name,
    brand: product.brand,
    category: product.category as "tops" | "bottoms" | "outerwear" | "shoes" | "bags" | "accessories",
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    affiliateUrl: product.affiliateUrl,
    affiliateProvider: providerName,
    sku: `${providerName}:${product.externalId}`,
    description: product.description ?? null,
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    inStock: 1,
  };
}

export async function syncProducts(
  provider: AffiliateProvider,
  categories: string[],
  limit: number = 20,
): Promise<SyncResult> {
  let synced = 0;
  let errors = 0;

  for (const category of categories) {
    try {
      const products = await provider.searchProducts("", category, limit);

      for (const product of products) {
        try {
          const values = mapToProductInsert(product, provider.name);
          await db
            .insert(productsTable)
            .values(values)
            .onConflictDoUpdate({
              target: productsTable.sku,
              set: {
                name: values.name,
                brand: values.brand,
                price: values.price,
                imageUrl: values.imageUrl,
                affiliateUrl: values.affiliateUrl,
                description: values.description,
                colors: values.colors,
                sizes: values.sizes,
                inStock: 1,
              },
            })
            .returning();
          synced++;
        } catch (err) {
          console.error(`[sync] Failed to upsert product ${product.externalId}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error(`[sync] Failed to fetch ${category} from ${provider.name}:`, err);
      errors++;
    }
  }

  return { provider: provider.name, synced, errors };
}
