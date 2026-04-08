import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Must import after mocking fetch
import { rakutenProvider } from "@/lib/affiliates/providers/rakuten";

const MOCK_RAKUTEN_RESPONSE = {
  result: {
    items: [
      {
        mid: "rakuten-123",
        merchantname: "Nordstrom",
        linkname: "Classic White Tee",
        description: "A classic white cotton t-shirt",
        category: { mid: "1", name: "Tops" },
        price: { amount: "29.99", currency: "USD" },
        imageurl: "https://cdn.rakuten.com/tee.jpg",
        linkurl: "https://click.linksynergy.com/link?id=abc&offerid=123",
      },
      {
        mid: "rakuten-456",
        merchantname: "Zara",
        linkname: "Slim Fit Chinos",
        description: "Tailored slim fit chino pants",
        category: { mid: "2", name: "Bottoms" },
        price: { amount: "49.99", currency: "USD" },
        imageurl: "https://cdn.rakuten.com/chinos.jpg",
        linkurl: "https://click.linksynergy.com/link?id=def&offerid=456",
      },
    ],
  },
};

describe("rakutenProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAKUTEN_API_KEY = "test-api-key";
    process.env.RAKUTEN_AFFILIATE_ID = "test-affiliate-id";
  });

  it("has name 'rakuten'", () => {
    expect(rakutenProvider.name).toBe("rakuten");
  });

  it("searchProducts returns mapped AffiliateProducts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RAKUTEN_RESPONSE,
    });

    const results = await rakutenProvider.searchProducts("white tee", "tops", 10);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      externalId: "rakuten-123",
      name: "Classic White Tee",
      brand: "Nordstrom",
      category: "tops",
      price: 2999,
      currency: "USD",
      imageUrl: "https://cdn.rakuten.com/tee.jpg",
      affiliateUrl: "https://click.linksynergy.com/link?id=abc&offerid=123",
      description: "A classic white cotton t-shirt",
      colors: [],
      sizes: [],
    });
  });

  it("searchProducts returns empty array on API error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await rakutenProvider.searchProducts("dress");
    expect(results).toEqual([]);
  });

  it("getProduct fetches a single product by ID", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          items: [MOCK_RAKUTEN_RESPONSE.result.items[0]],
        },
      }),
    });

    const product = await rakutenProvider.getProduct("rakuten-123");
    expect(product).not.toBeNull();
    expect(product!.externalId).toBe("rakuten-123");
  });

  it("getProduct returns null when not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { items: [] } }),
    });

    const product = await rakutenProvider.getProduct("nonexistent");
    expect(product).toBeNull();
  });
});
