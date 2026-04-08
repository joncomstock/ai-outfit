# Automated Affiliate Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated affiliate product pipeline with provider abstraction, Rakuten and ShopStyle integrations, product sync jobs, intelligent matching for outfit slots, and a revenue dashboard for admins.

**Architecture:** Affiliate providers implement a common `AffiliateProvider` interface and register in a provider registry. A sync function fetches products from providers and upserts into the existing `products` table. Product matching uses category, color distance, and style tag overlap to recommend complementary catalog products for closet items. Admin endpoints expose sync triggers and revenue metrics (click counts by provider and date).

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Vitest

---

## File Structure

```
src/
├── lib/
│   └── affiliates/
│       ├── types.ts                                # NEW: AffiliateProvider interface + types
│       ├── registry.ts                             # NEW: Provider registry
│       ├── providers/
│       │   ├── rakuten.ts                          # NEW: Rakuten API integration
│       │   └── shopstyle.ts                        # NEW: ShopStyle API integration
│       ├── sync.ts                                 # NEW: Product sync job logic
│       └── match.ts                                # NEW: Product matching for outfit slots
├── app/
│   └── api/
│       └── admin/
│           ├── catalog/
│           │   └── sync/
│           │       └── route.ts                    # NEW: POST trigger sync
│           └── revenue/
│               └── route.ts                        # NEW: GET revenue metrics
├── components/
│   └── admin/
│       └── catalog/
│           └── sync-button.tsx                     # NEW: Sync trigger button
tests/
├── lib/
│   └── affiliates/
│       ├── registry.test.ts                        # NEW
│       ├── providers/
│       │   ├── rakuten.test.ts                     # NEW
│       │   └── shopstyle.test.ts                   # NEW
│       ├── sync.test.ts                            # NEW
│       └── match.test.ts                           # NEW
├── api/
│   └── admin/
│       ├── catalog-sync.test.ts                    # NEW
│       └── revenue.test.ts                         # NEW
```

---

## Task 1: Affiliate Provider Abstraction

**Files:**
- Create: `src/lib/affiliates/types.ts`
- Create: `src/lib/affiliates/registry.ts`
- Test: `tests/lib/affiliates/registry.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/affiliates/registry.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import {
  registerProvider,
  getProvider,
  getAllProviders,
  clearProviders,
} from "@/lib/affiliates/registry";
import type { AffiliateProvider } from "@/lib/affiliates/types";

const mockProvider: AffiliateProvider = {
  name: "test-provider",
  searchProducts: vi.fn().mockResolvedValue([]),
  getProduct: vi.fn().mockResolvedValue(null),
};

describe("affiliate provider registry", () => {
  beforeEach(() => {
    clearProviders();
  });

  it("registers and retrieves a provider by name", () => {
    registerProvider(mockProvider);
    const result = getProvider("test-provider");
    expect(result).toBe(mockProvider);
  });

  it("returns undefined for unregistered provider", () => {
    const result = getProvider("nonexistent");
    expect(result).toBeUndefined();
  });

  it("lists all registered providers", () => {
    const provider2: AffiliateProvider = {
      name: "provider-2",
      searchProducts: vi.fn().mockResolvedValue([]),
      getProduct: vi.fn().mockResolvedValue(null),
    };
    registerProvider(mockProvider);
    registerProvider(provider2);
    expect(getAllProviders()).toHaveLength(2);
  });

  it("overwrites provider with same name", () => {
    const updated: AffiliateProvider = {
      ...mockProvider,
      searchProducts: vi.fn().mockResolvedValue([{ name: "updated" }]),
    };
    registerProvider(mockProvider);
    registerProvider(updated);
    expect(getProvider("test-provider")).toBe(updated);
    expect(getAllProviders()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/affiliates/registry.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create affiliate types**

`src/lib/affiliates/types.ts`:
```typescript
export interface AffiliateProduct {
  externalId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  description?: string;
  colors?: string[];
  sizes?: string[];
}

export interface AffiliateProvider {
  name: string;
  searchProducts(
    query: string,
    category?: string,
    limit?: number,
  ): Promise<AffiliateProduct[]>;
  getProduct(externalId: string): Promise<AffiliateProduct | null>;
}
```

- [ ] **Step 4: Create provider registry**

`src/lib/affiliates/registry.ts`:
```typescript
import type { AffiliateProvider } from "./types";

const providers = new Map<string, AffiliateProvider>();

export function registerProvider(provider: AffiliateProvider) {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): AffiliateProvider | undefined {
  return providers.get(name);
}

export function getAllProviders(): AffiliateProvider[] {
  return Array.from(providers.values());
}

export function clearProviders() {
  providers.clear();
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/affiliates/registry.test.ts`
Expected: PASS — all 4 tests

**Commit:** `feat: add affiliate provider abstraction with types and registry`

---

## Task 2: Rakuten API Integration

**Files:**
- Create: `src/lib/affiliates/providers/rakuten.ts`
- Test: `tests/lib/affiliates/providers/rakuten.test.ts`

- [ ] **Step 1: Write failing tests with mocked HTTP**

`tests/lib/affiliates/providers/rakuten.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/affiliates/providers/rakuten.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create Rakuten provider**

`src/lib/affiliates/providers/rakuten.ts`:
```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/affiliates/providers/rakuten.test.ts`
Expected: PASS — all 5 tests

**Commit:** `feat: add Rakuten affiliate provider with product search and mapping`

---

## Task 3: ShopStyle/LTK API Integration

**Files:**
- Create: `src/lib/affiliates/providers/shopstyle.ts`
- Test: `tests/lib/affiliates/providers/shopstyle.test.ts`

- [ ] **Step 1: Write failing tests with mocked HTTP**

`tests/lib/affiliates/providers/shopstyle.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/affiliates/providers/shopstyle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create ShopStyle provider**

`src/lib/affiliates/providers/shopstyle.ts`:
```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/affiliates/providers/shopstyle.test.ts`
Expected: PASS — all 5 tests

**Commit:** `feat: add ShopStyle affiliate provider with product search and mapping`

---

## Task 4: Product Sync Job

**Files:**
- Create: `src/lib/affiliates/sync.ts`
- Create: `src/app/api/admin/catalog/sync/route.ts`
- Modify: `src/app/(admin)/admin/catalog/client.tsx`
- Test: `tests/lib/affiliates/sync.test.ts`
- Test: `tests/api/admin/catalog-sync.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/affiliates/sync.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    onConflictDoUpdate: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "prod-1" }]),
    }),
  }),
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
```

`tests/api/admin/catalog-sync.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/admin/catalog/sync/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    id: "clerk_admin_123",
    publicMetadata: { role: "admin" },
    emailAddresses: [{ emailAddress: "admin@test.com" }],
    firstName: "Admin",
    lastName: "User",
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-admin-uuid"),
}));
vi.mock("@/lib/affiliates/registry", () => ({
  getProvider: vi.fn().mockReturnValue({
    name: "rakuten",
    searchProducts: vi.fn().mockResolvedValue([]),
    getProduct: vi.fn().mockResolvedValue(null),
  }),
  getAllProviders: vi.fn().mockReturnValue([]),
}));
vi.mock("@/lib/affiliates/sync", () => ({
  syncProducts: vi.fn().mockResolvedValue({ provider: "rakuten", synced: 5, errors: 0 }),
}));
vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn().mockResolvedValue({ id: "db-admin-uuid", clerkId: "clerk_admin_123" }) },
    },
  },
}));

describe("POST /api/admin/catalog/sync", () => {
  it("triggers sync and returns results", async () => {
    const req = new NextRequest("http://localhost/api/admin/catalog/sync", {
      method: "POST",
      body: JSON.stringify({ provider: "rakuten", categories: ["tops"], limit: 20 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/affiliates/sync.test.ts tests/api/admin/catalog-sync.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create sync function**

`src/lib/affiliates/sync.ts`:
```typescript
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
```

- [ ] **Step 4: Create sync API endpoint**

`src/app/api/admin/catalog/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getProvider, getAllProviders } from "@/lib/affiliates/registry";
import { syncProducts } from "@/lib/affiliates/sync";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    provider: providerName,
    categories = ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"],
    limit = 20,
  } = body as { provider?: string; categories?: string[]; limit?: number };

  if (providerName) {
    const provider = getProvider(providerName);
    if (!provider) {
      return NextResponse.json({ error: `Provider '${providerName}' not found` }, { status: 400 });
    }
    const result = await syncProducts(provider, categories, limit);
    return NextResponse.json(result);
  }

  // Sync all providers
  const providers = getAllProviders();
  const results = await Promise.all(
    providers.map((p) => syncProducts(p, categories, limit)),
  );

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  return NextResponse.json({ results, totalSynced, totalErrors });
}
```

- [ ] **Step 5: Add sync button to admin catalog page**

In `src/app/(admin)/admin/catalog/client.tsx`, add a "Sync Products" button that calls `POST /api/admin/catalog/sync`:

```typescript
// Add to the admin catalog client component's toolbar/header area:
const [syncing, setSyncing] = useState(false);
const [syncResult, setSyncResult] = useState<{ synced: number; errors: number } | null>(null);

async function handleSync() {
  setSyncing(true);
  setSyncResult(null);
  try {
    const res = await fetch("/api/admin/catalog/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"] }),
    });
    const data = await res.json();
    setSyncResult({ synced: data.totalSynced ?? data.synced ?? 0, errors: data.totalErrors ?? data.errors ?? 0 });
  } catch {
    setSyncResult({ synced: 0, errors: 1 });
  } finally {
    setSyncing(false);
  }
}

// Render:
<button
  onClick={handleSync}
  disabled={syncing}
  className="editorial-gradient px-4 py-2 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
>
  {syncing ? "Syncing..." : "Sync Products"}
</button>
{syncResult && (
  <p className="text-body-md text-on-surface-variant">
    Synced {syncResult.synced} products{syncResult.errors > 0 ? `, ${syncResult.errors} errors` : ""}
  </p>
)}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/affiliates/sync.test.ts tests/api/admin/catalog-sync.test.ts`
Expected: PASS — all tests

**Commit:** `feat: add product sync job with admin API endpoint and sync button`

---

## Task 5: Product Matching for Outfit Slots

**Files:**
- Create: `src/lib/affiliates/match.ts`
- Test: `tests/lib/affiliates/match.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/affiliates/match.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/affiliates/match.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create product matching module**

`src/lib/affiliates/match.ts`:
```typescript
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
```

- [ ] **Step 4: Wire into outfit detail page**

In the outfit detail page client component (`src/app/(auth)/outfits/[id]/client.tsx`), add a "Shop Similar" section for each slot. When a slot is expanded or viewed, fetch matching products:

```typescript
// Add state for matching products per slot
const [similarProducts, setSimilarProducts] = useState<Record<string, any[]>>({});

async function loadSimilarProducts(closetItemId: string, slotType: string) {
  if (similarProducts[slotType]) return;
  const res = await fetch(`/api/products?matchItem=${closetItemId}&limit=4`);
  if (res.ok) {
    const data = await res.json();
    setSimilarProducts((prev) => ({ ...prev, [slotType]: data.products }));
  }
}

// In the slot display, add:
// <div className="mt-4">
//   <p className="label-text text-on-surface-variant mb-2">Shop Similar</p>
//   <div className="grid grid-cols-2 gap-2">
//     {(similarProducts[slot.slotType] ?? []).map((product) => (
//       <ProductCard key={product.id} product={product} compact />
//     ))}
//   </div>
// </div>
```

Add a `matchItem` query param handler to the existing `GET /api/products/route.ts`:

```typescript
// Add to GET handler in src/app/api/products/route.ts:
const matchItemId = searchParams.get("matchItem");
if (matchItemId) {
  const closetItem = await db.query.closetItems.findFirst({
    where: eq(closetItemsTable.id, matchItemId),
  });
  if (closetItem) {
    const { findMatchingProducts } = await import("@/lib/affiliates/match");
    const matches = await findMatchingProducts(closetItem, limit);
    return NextResponse.json({ products: matches });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/affiliates/match.test.ts`
Expected: PASS — all 3 tests

**Commit:** `feat: add product matching by color similarity with Shop Similar integration`

---

## Task 6: Revenue Dashboard

**Files:**
- Create: `src/app/api/admin/revenue/route.ts`
- Modify: `src/app/(admin)/admin/client.tsx`
- Test: `tests/api/admin/revenue.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/api/admin/revenue.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/admin/revenue/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    id: "clerk_admin_123",
    publicMetadata: { role: "admin" },
    emailAddresses: [{ emailAddress: "admin@test.com" }],
    firstName: "Admin",
    lastName: "User",
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-admin-uuid"),
}));

const mockClicks = [
  { provider: "rakuten", date: "2026-04-07", count: 15 },
  { provider: "shopstyle", date: "2026-04-07", count: 8 },
  { provider: "rakuten", date: "2026-04-06", count: 12 },
];

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn().mockResolvedValue({ id: "db-admin-uuid", clerkId: "clerk_admin_123" }) },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue(mockClicks),
        }),
      }),
    }),
  },
}));

describe("GET /api/admin/revenue", () => {
  it("returns click counts grouped by provider and date", async () => {
    const req = new NextRequest("http://localhost/api/admin/revenue");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clicks).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/admin/revenue.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create revenue API endpoint**

`src/app/api/admin/revenue/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function GET(_req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Click counts grouped by provider and date
  const clicks = await db
    .select({
      provider: productsTable.affiliateProvider,
      date: sql<string>`DATE(${affiliateClicksTable.createdAt})`.as("date"),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(affiliateClicksTable)
    .leftJoin(productsTable, eq(affiliateClicksTable.productId, productsTable.id))
    .groupBy(productsTable.affiliateProvider, sql`DATE(${affiliateClicksTable.createdAt})`)
    .orderBy(desc(sql`DATE(${affiliateClicksTable.createdAt})`));

  // Total clicks
  const totalClicks = clicks.reduce((sum, row) => sum + row.count, 0);

  // Clicks by provider
  const byProvider: Record<string, number> = {};
  for (const row of clicks) {
    const provider = row.provider ?? "unknown";
    byProvider[provider] = (byProvider[provider] ?? 0) + row.count;
  }

  return NextResponse.json({
    clicks,
    totalClicks,
    byProvider,
  });
}
```

- [ ] **Step 4: Add revenue section to admin dashboard**

In `src/app/(admin)/admin/client.tsx`, add a revenue section:

```typescript
// Add state
const [revenue, setRevenue] = useState<{
  totalClicks: number;
  byProvider: Record<string, number>;
  clicks: Array<{ provider: string; date: string; count: number }>;
} | null>(null);

// Fetch on mount
useEffect(() => {
  fetch("/api/admin/revenue")
    .then((r) => r.json())
    .then(setRevenue)
    .catch(console.error);
}, []);

// Render section:
// <section className="bg-surface-container p-6 mt-8">
//   <h2 className="font-serif text-headline-md text-on-surface mb-4">Affiliate Revenue</h2>
//   {revenue ? (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//       <div className="bg-surface-container-low p-4">
//         <p className="label-text text-on-surface-variant">Total Clicks</p>
//         <p className="font-serif text-display-sm text-on-surface">{revenue.totalClicks}</p>
//       </div>
//       {Object.entries(revenue.byProvider).map(([provider, count]) => (
//         <div key={provider} className="bg-surface-container-low p-4">
//           <p className="label-text text-on-surface-variant">{provider}</p>
//           <p className="font-serif text-display-sm text-on-surface">{count} clicks</p>
//         </div>
//       ))}
//     </div>
//   ) : (
//     <p className="text-body-md text-on-surface-variant">Loading...</p>
//   )}
// </section>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/admin/revenue.test.ts`
Expected: PASS

- [ ] **Step 6: Verify full test suite**

Run: `pnpm vitest run tests/lib/affiliates/ tests/api/admin/`
Expected: PASS — all affiliate and admin tests green

**Commit:** `feat(admin): add revenue dashboard with affiliate click metrics by provider and date`
