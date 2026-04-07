import type { NewProduct } from "@/db/schema/products";

interface CsvRow {
  name: string;
  brand: string;
  category: string;
  price: string;
  image_url: string;
  affiliate_url: string;
  description?: string;
  colors?: string;
  sizes?: string;
  sku?: string;
  currency?: string;
}

const VALID_CATEGORIES = ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"];

export function parseCsv(csvText: string): NewProduct[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const products: NewProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    const typed = row as unknown as CsvRow;

    if (!typed.name || !typed.brand || !typed.category || !typed.price || !typed.image_url || !typed.affiliate_url) {
      continue;
    }

    const category = typed.category.toLowerCase();
    if (!VALID_CATEGORIES.includes(category)) continue;

    const price = parseInt(typed.price, 10);
    if (isNaN(price) || price <= 0) continue;

    products.push({
      name: typed.name,
      brand: typed.brand,
      category: category as any,
      price,
      imageUrl: typed.image_url,
      affiliateUrl: typed.affiliate_url,
      description: typed.description || null,
      colors: typed.colors ? typed.colors.split(";").map((c) => c.trim()) : [],
      sizes: typed.sizes ? typed.sizes.split(";").map((s) => s.trim()) : [],
      sku: typed.sku || null,
      currency: typed.currency || "USD",
    });
  }

  return products;
}
