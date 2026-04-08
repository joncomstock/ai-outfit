import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";

interface ClosetItemForMatch {
  category: string | null;
  colors: string[] | null;
  styleTags?: string[] | null;
}

/**
 * Calculate color distance using simple RGB Euclidean distance.
 * Lower = more similar.
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

/**
 * Score how well a product matches a closet item.
 * Higher score = better match.
 */
function scoreProduct(
  product: { colors: string[] | null },
  itemColors: string[],
  _itemStyleTags: string[],
): number {
  let score = 0;

  // Color similarity: compare closest color pair
  const productColors = product.colors ?? [];
  if (itemColors.length > 0 && productColors.length > 0) {
    let minDist = Infinity;
    for (const ic of itemColors) {
      for (const pc of productColors) {
        const dist = colorDistance(ic, pc);
        if (dist < minDist) minDist = dist;
      }
    }
    // Max distance is ~441 (black to white). Normalize to 0-100.
    score += Math.max(0, 100 - (minDist / 441) * 100);
  }

  return score;
}

export async function findMatchingProducts(
  closetItem: ClosetItemForMatch,
  limit: number = 4,
) {
  const category = closetItem.category ?? "accessories";

  // Fetch candidate products in the same category
  const candidates = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.category, category as any),
        eq(productsTable.inStock, 1),
      ),
    );

  const itemColors = closetItem.colors ?? [];
  const itemTags = closetItem.styleTags ?? [];

  // Score and sort
  const scored = candidates.map((product) => ({
    ...product,
    _score: scoreProduct(product, itemColors, itemTags),
  }));

  scored.sort((a, b) => b._score - a._score);

  return scored.slice(0, limit).map(({ _score, ...product }) => product);
}
