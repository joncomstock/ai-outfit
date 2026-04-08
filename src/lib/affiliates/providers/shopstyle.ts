import type { AffiliateProduct, AffiliateProvider } from "../types";

const SHOPSTYLE_BASE_URL = "https://api.shopstyle.com/api/v2";

const CATEGORY_MAP: Record<string, string> = {
  tops: "tops",
  bottoms: "bottoms",
  outerwear: "jackets-coats",
  shoes: "shoes",
  bags: "bags",
  accessories: "accessories",
};

interface ShopStyleProduct {
  id: string;
  name: string;
  brandedName?: string;
  brand: { name: string };
  categories: Array<{ id: string; name: string }>;
  price: number;
  currency: string;
  image: { sizes: { Large?: { url: string } } };
  clickUrl: string;
  description?: string;
  colors?: Array<{ name: string }>;
  sizes?: Array<{ name: string }>;
}

function mapShopStyleProduct(product: ShopStyleProduct): AffiliateProduct {
  const firstCategory = product.categories?.[0]?.id?.toLowerCase() ?? "";
  const mappedCategory =
    Object.keys(CATEGORY_MAP).find((k) =>
      firstCategory.includes(k),
    ) ?? "accessories";

  return {
    externalId: String(product.id),
    name: product.name,
    brand: product.brand.name,
    category: mappedCategory,
    price: Math.round(product.price * 100),
    currency: product.currency,
    imageUrl: product.image?.sizes?.Large?.url ?? "",
    affiliateUrl: product.clickUrl,
    description: product.description,
    colors: product.colors?.map((c) => c.name) ?? [],
    sizes: product.sizes?.map((s) => s.name) ?? [],
  };
}

export const shopstyleProvider: AffiliateProvider = {
  name: "shopstyle",

  async searchProducts(
    query: string,
    category?: string,
    limit: number = 20,
  ): Promise<AffiliateProduct[]> {
    const apiKey = process.env.SHOPSTYLE_API_KEY;
    if (!apiKey) {
      console.warn("[shopstyle] Missing SHOPSTYLE_API_KEY");
      return [];
    }

    const params = new URLSearchParams({
      pid: apiKey,
      fts: query,
      offset: "0",
      limit: String(limit),
    });

    if (category && CATEGORY_MAP[category]) {
      params.set("cat", CATEGORY_MAP[category]);
    }

    try {
      const res = await fetch(`${SHOPSTYLE_BASE_URL}/products?${params}`);
      if (!res.ok) {
        console.error(`[shopstyle] API error: ${res.status}`);
        return [];
      }

      const data = await res.json();
      const products: ShopStyleProduct[] = data.products ?? [];
      return products.map(mapShopStyleProduct);
    } catch (err) {
      console.error("[shopstyle] Fetch error:", err);
      return [];
    }
  },

  async getProduct(externalId: string): Promise<AffiliateProduct | null> {
    const apiKey = process.env.SHOPSTYLE_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `${SHOPSTYLE_BASE_URL}/products/${externalId}?pid=${apiKey}`,
      );
      if (!res.ok) return null;

      const data: ShopStyleProduct = await res.json();
      return mapShopStyleProduct(data);
    } catch {
      return null;
    }
  },
};
