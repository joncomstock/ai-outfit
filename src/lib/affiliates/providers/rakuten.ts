import type { AffiliateProduct, AffiliateProvider } from "../types";

const RAKUTEN_BASE_URL = "https://api.linksynergy.com/productsearch/1.0";

const CATEGORY_MAP: Record<string, string> = {
  tops: "1",
  bottoms: "2",
  outerwear: "3",
  shoes: "4",
  bags: "5",
  accessories: "6",
};

const REVERSE_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k]),
);

interface RakutenItem {
  mid: string;
  merchantname: string;
  linkname: string;
  description?: string;
  category: { mid: string; name: string };
  price: { amount: string; currency: string };
  imageurl: string;
  linkurl: string;
}

function mapRakutenItem(item: RakutenItem): AffiliateProduct {
  const categoryId = item.category?.mid;
  const mappedCategory = REVERSE_CATEGORY_MAP[categoryId] ?? "accessories";

  return {
    externalId: item.mid,
    name: item.linkname,
    brand: item.merchantname,
    category: mappedCategory,
    price: Math.round(parseFloat(item.price.amount) * 100),
    currency: item.price.currency,
    imageUrl: item.imageurl,
    affiliateUrl: item.linkurl,
    description: item.description,
    colors: [],
    sizes: [],
  };
}

export const rakutenProvider: AffiliateProvider = {
  name: "rakuten",

  async searchProducts(
    query: string,
    category?: string,
    limit: number = 20,
  ): Promise<AffiliateProduct[]> {
    const apiKey = process.env.RAKUTEN_API_KEY;
    const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

    if (!apiKey || !affiliateId) {
      console.warn("[rakuten] Missing RAKUTEN_API_KEY or RAKUTEN_AFFILIATE_ID");
      return [];
    }

    const params = new URLSearchParams({
      token: apiKey,
      keyword: query,
      max: String(limit),
    });

    if (category && CATEGORY_MAP[category]) {
      params.set("cat", CATEGORY_MAP[category]);
    }

    try {
      const res = await fetch(`${RAKUTEN_BASE_URL}?${params}`);
      if (!res.ok) {
        console.error(`[rakuten] API error: ${res.status}`);
        return [];
      }

      const data = await res.json();
      const items: RakutenItem[] = data.result?.items ?? [];
      return items.map(mapRakutenItem);
    } catch (err) {
      console.error("[rakuten] Fetch error:", err);
      return [];
    }
  },

  async getProduct(externalId: string): Promise<AffiliateProduct | null> {
    const apiKey = process.env.RAKUTEN_API_KEY;
    if (!apiKey) return null;

    const params = new URLSearchParams({
      token: apiKey,
      mid: externalId,
      max: "1",
    });

    try {
      const res = await fetch(`${RAKUTEN_BASE_URL}?${params}`);
      if (!res.ok) return null;

      const data = await res.json();
      const items: RakutenItem[] = data.result?.items ?? [];
      return items.length > 0 ? mapRakutenItem(items[0]) : null;
    } catch {
      return null;
    }
  },
};
