import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInsert } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "prod-1" }]),
      }),
    }),
  });
  return { mockInsert };
});

vi.mock("@/db", () => ({
  db: {
    insert: mockInsert,
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: { sku: "sku" },
}));

import { syncProducts } from "@/lib/affiliates/sync";
import type { AffiliateProvider } from "@/lib/affiliates/types";

describe("syncProducts", () => {
  const mockProvider: AffiliateProvider = {
    name: "test-provider",
    searchProducts: vi.fn().mockResolvedValue([
      {
        externalId: "ext-1",
        name: "Test Product",
        brand: "Test Brand",
        category: "tops",
        price: 2999,
        currency: "USD",
        imageUrl: "https://example.com/img.jpg",
        affiliateUrl: "https://example.com/buy",
        description: "A test product",
        colors: ["white"],
        sizes: ["M"],
      },
    ]),
    getProduct: vi.fn().mockResolvedValue(null),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches products from provider and returns sync count", async () => {
    const result = await syncProducts(mockProvider, ["tops"], 10);
    expect(mockProvider.searchProducts).toHaveBeenCalledWith("", "tops", 10);
    expect(result.synced).toBe(1);
    expect(result.provider).toBe("test-provider");
  });

  it("syncs multiple categories", async () => {
    const result = await syncProducts(mockProvider, ["tops", "bottoms"], 5);
    expect(mockProvider.searchProducts).toHaveBeenCalledTimes(2);
    expect(result.synced).toBe(2);
  });

  it("handles empty results gracefully", async () => {
    (mockProvider.searchProducts as any).mockResolvedValueOnce([]);
    const result = await syncProducts(mockProvider, ["shoes"], 10);
    expect(result.synced).toBe(0);
  });
});
