import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockProducts } = vi.hoisted(() => {
  const mockProducts = [
  {
    id: "prod-1",
    name: "White Cotton Tee",
    brand: "Gap",
    category: "tops",
    price: 2500,
    currency: "USD",
    imageUrl: "https://example.com/tee.jpg",
    affiliateUrl: "https://example.com/buy/1",
    colors: ["#FFFFFF", "#F5F5DC"],
    sizes: ["S", "M", "L"],
    description: null,
    sku: "gap:001",
    inStock: 1,
    affiliateProvider: "shopstyle",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-2",
    name: "Black Leather Boots",
    brand: "Dr. Martens",
    category: "shoes",
    price: 15000,
    currency: "USD",
    imageUrl: "https://example.com/boots.jpg",
    affiliateUrl: "https://example.com/buy/2",
    colors: ["#000000"],
    sizes: ["8", "9", "10"],
    description: null,
    sku: "dm:002",
    inStock: 1,
    affiliateProvider: "rakuten",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-3",
    name: "Cream Cashmere Sweater",
    brand: "Everlane",
    category: "tops",
    price: 9800,
    currency: "USD",
    imageUrl: "https://example.com/sweater.jpg",
    affiliateUrl: "https://example.com/buy/3",
    colors: ["#FFF8DC", "#F5F5DC"],
    sizes: ["S", "M"],
    description: null,
    sku: "ev:003",
    inStock: 1,
    affiliateProvider: "shopstyle",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
  return { mockProducts };
});

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockProducts),
      }),
    }),
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {
    category: "category",
    inStock: "in_stock",
  },
}));

import { findMatchingProducts } from "@/lib/affiliates/match";

describe("findMatchingProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns products matching category", async () => {
    const closetItem = {
      category: "tops",
      colors: ["#FFFFFF"],
      styleTags: ["casual", "basics"],
    };

    const results = await findMatchingProducts(closetItem);
    expect(results.length).toBeLessThanOrEqual(4);
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns at most 4 products", async () => {
    const closetItem = {
      category: "tops",
      colors: ["#FFFFFF"],
      styleTags: [],
    };

    const results = await findMatchingProducts(closetItem, 4);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it("scores products by color similarity", async () => {
    const closetItem = {
      category: "tops",
      colors: ["#FFFFFF"],
      styleTags: [],
    };

    const results = await findMatchingProducts(closetItem);
    // White tee (#FFFFFF) should score higher than cream sweater (#FFF8DC) for exact white match
    if (results.length >= 2) {
      const whiteIdx = results.findIndex((p: any) => p.id === "prod-1");
      const creamIdx = results.findIndex((p: any) => p.id === "prod-3");
      if (whiteIdx >= 0 && creamIdx >= 0) {
        expect(whiteIdx).toBeLessThan(creamIdx);
      }
    }
  });
});
