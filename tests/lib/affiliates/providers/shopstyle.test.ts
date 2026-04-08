import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { shopstyleProvider } from "@/lib/affiliates/providers/shopstyle";

const MOCK_SHOPSTYLE_RESPONSE = {
  products: [
    {
      id: "ss-789",
      name: "Linen Button-Down Shirt",
      brandedName: "J.Crew Linen Button-Down Shirt",
      brand: { name: "J.Crew" },
      categories: [{ id: "tops", name: "Tops" }],
      priceLabel: "$68.00",
      price: 68.0,
      currency: "USD",
      image: { sizes: { Large: { url: "https://img.shopstyle.com/shirt.jpg" } } },
      clickUrl: "https://api.shopstyle.com/action/click?id=ss-789&pid=test-key",
      description: "A relaxed linen shirt for warm days",
      colors: [{ name: "Blue" }],
      sizes: [{ name: "S" }, { name: "M" }, { name: "L" }],
    },
  ],
  metadata: { total: 1, offset: 0, limit: 20 },
};

describe("shopstyleProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SHOPSTYLE_API_KEY = "test-shopstyle-key";
  });

  it("has name 'shopstyle'", () => {
    expect(shopstyleProvider.name).toBe("shopstyle");
  });

  it("searchProducts returns mapped products", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SHOPSTYLE_RESPONSE,
    });

    const results = await shopstyleProvider.searchProducts("linen shirt", "tops", 10);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      externalId: "ss-789",
      name: "Linen Button-Down Shirt",
      brand: "J.Crew",
      category: "tops",
      price: 6800,
      currency: "USD",
      imageUrl: "https://img.shopstyle.com/shirt.jpg",
      affiliateUrl: "https://api.shopstyle.com/action/click?id=ss-789&pid=test-key",
      description: "A relaxed linen shirt for warm days",
      colors: ["Blue"],
      sizes: ["S", "M", "L"],
    });
  });

  it("searchProducts returns empty array on error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    const results = await shopstyleProvider.searchProducts("dress");
    expect(results).toEqual([]);
  });

  it("getProduct fetches single product", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SHOPSTYLE_RESPONSE.products[0],
    });

    const product = await shopstyleProvider.getProduct("ss-789");
    expect(product).not.toBeNull();
    expect(product!.name).toBe("Linen Button-Down Shirt");
  });

  it("getProduct returns null on error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const product = await shopstyleProvider.getProduct("nonexistent");
    expect(product).toBeNull();
  });
});
