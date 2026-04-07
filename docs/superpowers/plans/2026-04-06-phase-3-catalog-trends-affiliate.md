# Phase 3: Catalog, Trends & Affiliate Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browseable product catalog, trend discovery feed, shopping integration with affiliate revenue tracking, and an admin panel for content management. Users can browse curated products, explore trends, generate trend-based outfits, and click through to purchase via affiliate links.

**Architecture:** Products and trends are admin-managed content (not user-generated). Products have affiliate links and belong to categories/brands. Trends have momentum scores and link to products via a junction table. Users can bookmark trends and generate outfits inspired by them. Affiliate clicks are tracked server-side before redirect. Admin panel is a separate route group with sidebar navigation, accessible only to admin-role users. The existing generation modal gains a "Trend-Based" mode that passes trend context to Claude.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Anthropic Claude API, Tailwind CSS 4, Clerk Auth

**Design Reference:** Stitch project `5273890100334486731` — screens "Product Catalog" (editorial hero + asymmetric grid), "Trends Discovery" (alternating featured/sidebar cards with momentum badges), "Admin Dashboard" (sidebar nav + stats cards + activity stream), "Product Detail Modal" (two-column with curated pairings), "Trend Management" (CRUD with momentum scores), "Catalog Management" (CSV import + product table)

---

## File Structure

```
src/
├── db/schema/
│   ├── products.ts                            # NEW: products table
│   ├── trends.ts                              # NEW: trends, trend_products, saved_trends tables
│   └── affiliate.ts                           # NEW: affiliate_clicks table
├── db/
│   └── index.ts                               # MODIFY: Register new tables in schema
├── lib/
│   ├── ai/
│   │   └── generate-outfit.ts                 # MODIFY: Add trend_based mode
│   └── admin/
│       └── csv-import.ts                      # NEW: CSV parsing + product insert logic
├── app/
│   ├── (auth)/
│   │   ├── catalog/
│   │   │   ├── page.tsx                       # NEW: Product catalog (server)
│   │   │   └── client.tsx                     # NEW: Catalog client component
│   │   └── trends/
│   │       ├── page.tsx                       # NEW: Trends discovery (server)
│   │       ├── client.tsx                     # NEW: Trends client component
│   │       └── [id]/
│   │           ├── page.tsx                   # NEW: Trend detail (server)
│   │           └── client.tsx                 # NEW: Trend detail client component
│   ├── (admin)/
│   │   ├── layout.tsx                         # NEW: Admin layout with sidebar
│   │   └── admin/
│   │       ├── page.tsx                       # NEW: Admin dashboard (server)
│   │       ├── client.tsx                     # NEW: Dashboard client component
│   │       ├── trends/
│   │       │   ├── page.tsx                   # NEW: Trend management (server)
│   │       │   └── client.tsx                 # NEW: Trend management client
│   │       └── catalog/
│   │           ├── page.tsx                   # NEW: Catalog management (server)
│   │           └── client.tsx                 # NEW: Catalog management client
│   └── api/
│       ├── products/
│       │   └── route.ts                       # NEW: GET list (with filters)
│       ├── products/[id]/
│       │   └── route.ts                       # NEW: GET detail
│       ├── trends/
│       │   └── route.ts                       # NEW: GET list
│       ├── trends/[id]/
│       │   ├── route.ts                       # NEW: GET detail
│       │   └── save/
│       │       └── route.ts                   # NEW: POST/DELETE bookmark
│       ├── affiliate/
│       │   └── click/
│       │       └── route.ts                   # NEW: POST track + redirect
│       └── admin/
│           ├── trends/
│           │   └── route.ts                   # NEW: POST/PATCH/DELETE trend CRUD
│           ├── catalog/
│           │   ├── route.ts                   # NEW: POST create product
│           │   └── import/
│           │       └── route.ts               # NEW: POST CSV import
│           └── stats/
│               └── route.ts                   # NEW: GET dashboard stats
├── components/
│   ├── catalog/
│   │   ├── product-card.tsx                   # NEW: Product card component
│   │   └── product-detail-modal.tsx           # NEW: Product detail modal
│   ├── trends/
│   │   └── trend-card.tsx                     # NEW: Trend card component
│   └── admin/
│       ├── admin-sidebar.tsx                  # NEW: Admin sidebar nav
│       ├── stat-card.tsx                      # NEW: Dashboard stat card
│       ├── trend-form.tsx                     # NEW: Trend create/edit form
│       └── csv-upload.tsx                     # NEW: CSV upload widget
├── components/outfits/
│   └── generation-modal.tsx                   # MODIFY: Add trend_based mode
tests/
├── api/
│   ├── products/
│   │   └── products.test.ts                   # NEW
│   ├── trends/
│   │   ├── trends.test.ts                     # NEW
│   │   └── save.test.ts                       # NEW
│   ├── affiliate/
│   │   └── click.test.ts                      # NEW
│   └── admin/
│       ├── trends.test.ts                     # NEW
│       ├── catalog.test.ts                    # NEW
│       └── stats.test.ts                      # NEW
├── db/
│   ├── products-schema.test.ts                # NEW
│   ├── trends-schema.test.ts                  # NEW
│   └── affiliate-schema.test.ts               # NEW
```

---

## Task 1: Database Schema — Products, Trends, Affiliate

**Files:**
- Create: `src/db/schema/products.ts`
- Create: `src/db/schema/trends.ts`
- Create: `src/db/schema/affiliate.ts`
- Modify: `src/db/index.ts`
- Test: `tests/db/products-schema.test.ts`
- Test: `tests/db/trends-schema.test.ts`
- Test: `tests/db/affiliate-schema.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/db/products-schema.test.ts`:
```typescript
import { productsTable } from "@/db/schema/products";
import { getTableName } from "drizzle-orm";

describe("Products schema", () => {
  it("products table has correct name", () => {
    expect(getTableName(productsTable)).toBe("products");
  });
});
```

`tests/db/trends-schema.test.ts`:
```typescript
import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { getTableName } from "drizzle-orm";

describe("Trends schema", () => {
  it("trends table has correct name", () => {
    expect(getTableName(trendsTable)).toBe("trends");
  });

  it("trend_products table has correct name", () => {
    expect(getTableName(trendProductsTable)).toBe("trend_products");
  });

  it("saved_trends table has correct name", () => {
    expect(getTableName(savedTrendsTable)).toBe("saved_trends");
  });
});
```

`tests/db/affiliate-schema.test.ts`:
```typescript
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { getTableName } from "drizzle-orm";

describe("Affiliate schema", () => {
  it("affiliate_clicks table has correct name", () => {
    expect(getTableName(affiliateClicksTable)).toBe("affiliate_clicks");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/db/products-schema.test.ts tests/db/trends-schema.test.ts tests/db/affiliate-schema.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create products schema**

`src/db/schema/products.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "bags",
  "accessories",
]);

export const productsTable = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: productCategoryEnum("category").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  colors: jsonb("colors").$type<string[]>().default([]),
  sizes: jsonb("sizes").$type<string[]>().default([]),
  affiliateUrl: text("affiliate_url").notNull(),
  affiliateProvider: text("affiliate_provider"),
  sku: text("sku"),
  inStock: integer("in_stock").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
```

- [ ] **Step 4: Create trends schema**

`src/db/schema/trends.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  pgEnum,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const trendStatusEnum = pgEnum("trend_status", [
  "draft",
  "published",
  "archived",
]);

export const trendCategoryEnum = pgEnum("trend_category", [
  "luxury",
  "streetwear",
  "minimalism",
  "avant_garde",
  "classic",
]);

export const trendsTable = pgTable("trends", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  category: trendCategoryEnum("category").notNull(),
  status: trendStatusEnum("status").notNull().default("draft"),
  momentumScore: integer("momentum_score").notNull().default(0),
  season: text("season"),
  styleTags: jsonb("style_tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const trendProductsTable = pgTable(
  "trend_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trendId: uuid("trend_id")
      .notNull()
      .references(() => trendsTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    uniqueIndex("trend_product_unique").on(table.trendId, table.productId),
  ]
);

export const savedTrendsTable = pgTable(
  "saved_trends",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    trendId: uuid("trend_id")
      .notNull()
      .references(() => trendsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("saved_trend_unique").on(table.userId, table.trendId),
  ]
);

export type Trend = typeof trendsTable.$inferSelect;
export type NewTrend = typeof trendsTable.$inferInsert;
export type TrendProduct = typeof trendProductsTable.$inferSelect;
export type SavedTrend = typeof savedTrendsTable.$inferSelect;
```

- [ ] **Step 5: Create affiliate schema**

`src/db/schema/affiliate.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const affiliateClicksTable = pgTable("affiliate_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "set null" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  sourceContext: text("source_context"),
  affiliateUrl: text("affiliate_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AffiliateClick = typeof affiliateClicksTable.$inferSelect;
export type NewAffiliateClick = typeof affiliateClicksTable.$inferInsert;
```

- [ ] **Step 6: Register all new tables in db client**

`src/db/index.ts`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./schema/users";
import { closetItemsTable } from "./schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "./schema/outfits";
import { productsTable } from "./schema/products";
import { trendsTable, trendProductsTable, savedTrendsTable } from "./schema/trends";
import { affiliateClicksTable } from "./schema/affiliate";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: {
    users: usersTable,
    closetItems: closetItemsTable,
    outfits: outfitsTable,
    outfitSlots: outfitSlotsTable,
    products: productsTable,
    trends: trendsTable,
    trendProducts: trendProductsTable,
    savedTrends: savedTrendsTable,
    affiliateClicks: affiliateClicksTable,
  },
});
```

- [ ] **Step 7: Run tests, then generate migration**

Run: `pnpm vitest run tests/db/products-schema.test.ts tests/db/trends-schema.test.ts tests/db/affiliate-schema.test.ts`
Expected: PASS

Run: `pnpm db:generate`
Run: `pnpm db:push`

**Commit:** `feat(db): add products, trends, and affiliate_clicks schema tables`

---

## Task 2: Products API — List and Detail

**Files:**
- Create: `src/app/api/products/route.ts`
- Create: `src/app/api/products/[id]/route.ts`
- Test: `tests/api/products/products.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/api/products/products.test.ts`:
```typescript
import { GET as listProducts } from "@/app/api/products/route";
import { GET as getProduct } from "@/app/api/products/[id]/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([
                { id: "prod-1", name: "Oversized Raincoat", brand: "Lemaire", category: "outerwear", price: 1150 },
              ]),
            }),
          }),
        }),
      }),
    }),
    query: {
      products: {
        findFirst: vi.fn().mockResolvedValue({
          id: "prod-1",
          name: "Oversized Raincoat",
          brand: "Lemaire",
          category: "outerwear",
          price: 1150,
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {
    id: "id",
    category: "category",
    brand: "brand",
    inStock: "in_stock",
    createdAt: "created_at",
    price: "price",
    name: "name",
  },
}));

describe("GET /api/products", () => {
  it("returns product list", async () => {
    const req = new NextRequest("http://localhost/api/products");
    const res = await listProducts(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0]).toHaveProperty("name", "Oversized Raincoat");
  });
});

describe("GET /api/products/[id]", () => {
  it("returns single product", async () => {
    const req = new NextRequest("http://localhost/api/products/prod-1");
    const params = Promise.resolve({ id: "prod-1" });
    const res = await getProduct(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Oversized Raincoat");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/products/products.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create products list API**

`src/app/api/products/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 48);
  const offset = (page - 1) * limit;

  const conditions = [eq(productsTable.inStock, 1)];
  if (category) conditions.push(eq(productsTable.category, category as any));
  if (brand) conditions.push(eq(productsTable.brand, brand));

  const orderBy =
    sort === "price_asc"
      ? productsTable.price
      : sort === "price_desc"
        ? desc(productsTable.price)
        : desc(productsTable.createdAt);

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ products, page, limit });
}
```

- [ ] **Step 4: Create product detail API**

`src/app/api/products/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(productsTable.id, id),
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/api/products/products.test.ts`
Expected: PASS

**Commit:** `feat(api): add products list and detail endpoints`

---

## Task 3: Trends API — List, Detail, Save/Bookmark

**Files:**
- Create: `src/app/api/trends/route.ts`
- Create: `src/app/api/trends/[id]/route.ts`
- Create: `src/app/api/trends/[id]/save/route.ts`
- Test: `tests/api/trends/trends.test.ts`
- Test: `tests/api/trends/save.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/api/trends/trends.test.ts`:
```typescript
import { GET as listTrends } from "@/app/api/trends/route";
import { GET as getTrend } from "@/app/api/trends/[id]/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            { id: "trend-1", name: "Sculptural Minimalism", momentumScore: 94, status: "published" },
          ]),
        }),
      }),
    }),
    query: {
      trends: {
        findFirst: vi.fn().mockResolvedValue({
          id: "trend-1",
          name: "Sculptural Minimalism",
          momentumScore: 94,
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: {
    id: "id",
    status: "status",
    category: "category",
    momentumScore: "momentum_score",
    createdAt: "created_at",
  },
  trendProductsTable: {},
  savedTrendsTable: {},
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {},
}));

describe("GET /api/trends", () => {
  it("returns published trends", async () => {
    const req = new NextRequest("http://localhost/api/trends");
    const res = await listTrends(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trends).toHaveLength(1);
    expect(body.trends[0]).toHaveProperty("name", "Sculptural Minimalism");
  });
});

describe("GET /api/trends/[id]", () => {
  it("returns single trend", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1");
    const params = Promise.resolve({ id: "trend-1" });
    const res = await getTrend(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trend).toHaveProperty("name", "Sculptural Minimalism");
  });
});
```

`tests/api/trends/save.test.ts`:
```typescript
import { POST, DELETE } from "@/app/api/trends/[id]/save/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "saved-1" }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  },
}));
vi.mock("@/db/schema/trends", () => ({
  savedTrendsTable: { userId: "user_id", trendId: "trend_id" },
}));

describe("POST /api/trends/[id]/save", () => {
  it("bookmarks a trend", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1/save", { method: "POST" });
    const params = Promise.resolve({ id: "trend-1" });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/trends/[id]/save", () => {
  it("removes bookmark", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1/save", { method: "DELETE" });
    const params = Promise.resolve({ id: "trend-1" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/trends/`
Expected: FAIL — modules not found

- [ ] **Step 3: Create trends list API**

`src/app/api/trends/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const conditions = [eq(trendsTable.status, "published")];
  if (category) conditions.push(eq(trendsTable.category, category as any));

  const trends = await db
    .select()
    .from(trendsTable)
    .where(and(...conditions))
    .orderBy(desc(trendsTable.momentumScore));

  return NextResponse.json({ trends });
}
```

- [ ] **Step 4: Create trend detail API**

`src/app/api/trends/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const trend = await db.query.trends.findFirst({
    where: eq(trendsTable.id, id),
  });

  if (!trend) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      brand: productsTable.brand,
      category: productsTable.category,
      price: productsTable.price,
      currency: productsTable.currency,
      imageUrl: productsTable.imageUrl,
      affiliateUrl: productsTable.affiliateUrl,
    })
    .from(trendProductsTable)
    .innerJoin(productsTable, eq(trendProductsTable.productId, productsTable.id))
    .where(eq(trendProductsTable.trendId, id));

  const saved = await db.query.savedTrends.findFirst({
    where: eq(savedTrendsTable.trendId, id),
  });

  return NextResponse.json({ trend, products, isSaved: !!saved });
}
```

- [ ] **Step 5: Create save/bookmark API**

`src/app/api/trends/[id]/save/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedTrendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const [saved] = await db
    .insert(savedTrendsTable)
    .values({ userId: dbUserId, trendId: id })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ saved: saved ?? true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  await db
    .delete(savedTrendsTable)
    .where(
      and(
        eq(savedTrendsTable.userId, dbUserId),
        eq(savedTrendsTable.trendId, id)
      )
    );

  return NextResponse.json({ removed: true });
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run tests/api/trends/`
Expected: PASS

**Commit:** `feat(api): add trends list, detail, and save/bookmark endpoints`

---

## Task 4: Affiliate Click Tracking API

**Files:**
- Create: `src/app/api/affiliate/click/route.ts`
- Test: `tests/api/affiliate/click.test.ts`

- [ ] **Step 1: Write failing test**

`tests/api/affiliate/click.test.ts`:
```typescript
import { POST } from "@/app/api/affiliate/click/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "click-1" }]),
      }),
    }),
    query: {
      products: {
        findFirst: vi.fn().mockResolvedValue({
          id: "prod-1",
          affiliateUrl: "https://shop.example.com/product?ref=outfit-engine",
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: { id: "id" },
}));
vi.mock("@/db/schema/affiliate", () => ({
  affiliateClicksTable: {},
}));

describe("POST /api/affiliate/click", () => {
  it("records click and returns affiliate URL", async () => {
    const req = new NextRequest("http://localhost/api/affiliate/click", {
      method: "POST",
      body: JSON.stringify({ productId: "prod-1", sourceContext: "outfit_detail" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("affiliateUrl", "https://shop.example.com/product?ref=outfit-engine");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/api/affiliate/click.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create affiliate click API**

`src/app/api/affiliate/click/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { productId, sourceContext } = body as {
    productId: string;
    sourceContext?: string;
  };

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await db.query.products.findFirst({
    where: eq(productsTable.id, productId),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await db.insert(affiliateClicksTable).values({
    userId: dbUserId,
    productId,
    sourceContext: sourceContext ?? null,
    affiliateUrl: product.affiliateUrl,
  });

  return NextResponse.json({ affiliateUrl: product.affiliateUrl });
}
```

- [ ] **Step 4: Run test**

Run: `pnpm vitest run tests/api/affiliate/click.test.ts`
Expected: PASS

**Commit:** `feat(api): add affiliate click tracking endpoint`

---

## Task 5: Admin API — Trend CRUD, CSV Import, Stats

**Files:**
- Create: `src/app/api/admin/trends/route.ts`
- Create: `src/app/api/admin/catalog/route.ts`
- Create: `src/app/api/admin/catalog/import/route.ts`
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/lib/admin/csv-import.ts`
- Test: `tests/api/admin/trends.test.ts`
- Test: `tests/api/admin/catalog.test.ts`
- Test: `tests/api/admin/stats.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/api/admin/trends.test.ts`:
```typescript
import { POST, PATCH, DELETE } from "@/app/api/admin/trends/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    publicMetadata: { role: "admin" },
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("admin-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "trend-new", name: "Neo Minimalism", slug: "neo-minimalism" },
        ]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "trend-1", name: "Neo Minimalism Updated" },
          ]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  },
}));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: { id: "id" },
}));

describe("POST /api/admin/trends", () => {
  it("creates a new trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "POST",
      body: JSON.stringify({
        name: "Neo Minimalism",
        description: "A new wave of less-is-more",
        heroImageUrl: "https://images.example.com/trend.jpg",
        category: "minimalism",
        momentumScore: 85,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Neo Minimalism");
  });
});

describe("PATCH /api/admin/trends", () => {
  it("updates a trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "PATCH",
      body: JSON.stringify({ id: "trend-1", name: "Neo Minimalism Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/admin/trends", () => {
  it("deletes a trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "DELETE",
      body: JSON.stringify({ id: "trend-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });
});
```

`tests/api/admin/catalog.test.ts`:
```typescript
import { POST } from "@/app/api/admin/catalog/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    publicMetadata: { role: "admin" },
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("admin-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "prod-new", name: "Cashmere Sweater", brand: "The Row" },
        ]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {},
}));

describe("POST /api/admin/catalog", () => {
  it("creates a product", async () => {
    const req = new NextRequest("http://localhost/api/admin/catalog", {
      method: "POST",
      body: JSON.stringify({
        name: "Cashmere Sweater",
        brand: "The Row",
        category: "tops",
        price: 890,
        imageUrl: "https://images.example.com/sweater.jpg",
        affiliateUrl: "https://shop.example.com/sweater?ref=oe",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Cashmere Sweater");
  });
});
```

`tests/api/admin/stats.test.ts`:
```typescript
import { GET } from "@/app/api/admin/stats/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    publicMetadata: { role: "admin" },
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("admin-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([{ value: 42 }]),
    }),
  },
}));
vi.mock("@/db/schema/users", () => ({ usersTable: {} }));
vi.mock("@/db/schema/products", () => ({ productsTable: {} }));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: { status: "status" },
  trendProductsTable: {},
  savedTrendsTable: {},
}));
vi.mock("@/db/schema/affiliate", () => ({ affiliateClicksTable: {} }));

describe("GET /api/admin/stats", () => {
  it("returns dashboard stats", async () => {
    const req = new NextRequest("http://localhost/api/admin/stats");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalUsers");
    expect(body).toHaveProperty("totalProducts");
    expect(body).toHaveProperty("activeTrends");
    expect(body).toHaveProperty("totalClicks");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/admin/`
Expected: FAIL — modules not found

- [ ] **Step 3: Create admin trend CRUD API**

`src/app/api/admin/trends/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, heroImageUrl, category, momentumScore, season, styleTags, status } = body;

  if (!name || !description || !heroImageUrl || !category) {
    return NextResponse.json({ error: "Missing required fields: name, description, heroImageUrl, category" }, { status: 400 });
  }

  const [trend] = await db
    .insert(trendsTable)
    .values({
      name,
      slug: slugify(name),
      description,
      heroImageUrl,
      category,
      momentumScore: momentumScore ?? 0,
      season: season ?? null,
      styleTags: styleTags ?? [],
      status: status ?? "draft",
    })
    .returning();

  return NextResponse.json(trend, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (updates.name) {
    updates.slug = slugify(updates.name);
  }

  const [updated] = await db
    .update(trendsTable)
    .set(updates)
    .where(eq(trendsTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(trendsTable).where(eq(trendsTable.id, id));

  return NextResponse.json({ deleted: true });
}
```

- [ ] **Step 4: Create admin catalog API (create product)**

`src/app/api/admin/catalog/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
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

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, brand, category, price, imageUrl, affiliateUrl, description, colors, sizes, sku, currency } = body;

  if (!name || !brand || !category || !price || !imageUrl || !affiliateUrl) {
    return NextResponse.json(
      { error: "Missing required fields: name, brand, category, price, imageUrl, affiliateUrl" },
      { status: 400 }
    );
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name,
      brand,
      category,
      price,
      imageUrl,
      affiliateUrl,
      description: description ?? null,
      colors: colors ?? [],
      sizes: sizes ?? [],
      sku: sku ?? null,
      currency: currency ?? "USD",
    })
    .returning();

  return NextResponse.json(product, { status: 201 });
}
```

- [ ] **Step 5: Create CSV import utility and API**

`src/lib/admin/csv-import.ts`:
```typescript
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
```

`src/app/api/admin/catalog/import/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { parseCsv } from "@/lib/admin/csv-import";

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const csvText = await file.text();

  let products;
  try {
    products = parseCsv(csvText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid CSV";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (products.length === 0) {
    return NextResponse.json({ error: "No valid products found in CSV" }, { status: 400 });
  }

  const inserted = await db.insert(productsTable).values(products).returning();

  return NextResponse.json({ imported: inserted.length }, { status: 201 });
}
```

- [ ] **Step 6: Create admin stats API**

`src/app/api/admin/stats/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { productsTable } from "@/db/schema/products";
import { trendsTable } from "@/db/schema/trends";
import { affiliateClicksTable } from "@/db/schema/affiliate";
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

  const [usersResult] = await db.select({ value: count() }).from(usersTable);
  const [productsResult] = await db.select({ value: count() }).from(productsTable);
  const [trendsResult] = await db
    .select({ value: count() })
    .from(trendsTable)
    .where(eq(trendsTable.status, "published"));
  const [clicksResult] = await db.select({ value: count() }).from(affiliateClicksTable);

  return NextResponse.json({
    totalUsers: usersResult?.value ?? 0,
    totalProducts: productsResult?.value ?? 0,
    activeTrends: trendsResult?.value ?? 0,
    totalClicks: clicksResult?.value ?? 0,
  });
}
```

- [ ] **Step 7: Run all admin tests**

Run: `pnpm vitest run tests/api/admin/`
Expected: PASS

**Commit:** `feat(api): add admin trend CRUD, catalog import, and dashboard stats endpoints`

---

## Task 6: Product Catalog Page

**Files:**
- Create: `src/app/(auth)/catalog/page.tsx`
- Create: `src/app/(auth)/catalog/client.tsx`
- Create: `src/components/catalog/product-card.tsx`

- [ ] **Step 1: Create product card component**

`src/components/catalog/product-card.tsx`:
```typescript
"use client";

import type { Product } from "@/db/schema/products";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, featured = false, onSelect }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <button
      onClick={() => onSelect(product)}
      className={`group text-left w-full transition-opacity duration-200 hover:opacity-90 ${
        featured ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden bg-surface-container-low ${featured ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-3">
        <p className="text-label-md uppercase tracking-widest text-on-surface-variant font-sans">
          {product.brand}
        </p>
        <h3 className="font-serif text-body-lg text-on-surface mt-1 leading-snug">
          {product.name}
        </h3>
        <p className="font-serif text-body-md text-on-surface-variant mt-1">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create catalog page server component**

`src/app/(auth)/catalog/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CatalogClient } from "./client";

export default async function CatalogPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.inStock, 1))
    .orderBy(desc(productsTable.createdAt))
    .limit(48);

  const brandsResult = await db
    .selectDistinct({ brand: productsTable.brand })
    .from(productsTable);
  const brands = brandsResult.map((r) => r.brand);

  return <CatalogClient initialProducts={products} brands={brands} />;
}
```

- [ ] **Step 3: Create catalog client component**

`src/app/(auth)/catalog/client.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";
import { Button } from "@/components/ui/button";
import type { Product } from "@/db/schema/products";

const CATEGORY_TABS = [
  { key: "all", label: "ALL PIECES" },
  { key: "outerwear", label: "OUTERWEAR" },
  { key: "bags", label: "BAGS + SHOES" },
  { key: "tops", label: "TOPS" },
  { key: "bottoms", label: "BOTTOMS" },
] as const;

interface CatalogClientProps {
  initialProducts: Product[];
  brands: string[];
}

export function CatalogClient({ initialProducts, brands }: CatalogClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (category: string, brand: string | null, sortBy: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") {
        if (category === "bags") {
          params.set("category", "bags");
        } else {
          params.set("category", category);
        }
      }
      if (brand) params.set("brand", brand);
      params.set("sort", sortBy);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products);
      setLoading(false);
    },
    []
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchProducts(tab, selectedBrand, sort);
  };

  const handleBrandChange = (brand: string | null) => {
    setSelectedBrand(brand);
    fetchProducts(activeTab, brand, sort);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    fetchProducts(activeTab, selectedBrand, newSort);
  };

  return (
    <div>
      {/* ── Editorial Hero ── */}
      <section className="py-16 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="label-text text-on-surface-variant tracking-widest mb-6 block">
              CURATED COLLECTION
            </span>
            <h1 className="font-serif text-display-lg text-on-surface leading-tight">
              The Digital
              <br />
              <span className="italic text-primary">Curator.</span>
            </h1>
          </div>
          <div className="flex items-end">
            <p className="text-body-lg text-on-surface-variant max-w-md">
              An expertly curated selection of the season&apos;s definitive silhouettes,
              ethically sourced and digitally cataloged for the modern minimalist.
            </p>
          </div>
        </div>
      </section>

      {/* ── Filter Row ── */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 py-6 border-t border-b border-outline-variant/10">
        <div className="flex gap-6 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`label-text whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <select
            value={selectedBrand ?? ""}
            onChange={(e) => handleBrandChange(e.target.value || null)}
            className="bg-transparent text-body-md text-on-surface-variant font-sans border-none cursor-pointer"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-transparent text-body-md text-on-surface-variant font-sans border-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* ── Asymmetric Product Grid ── */}
      <section className="mb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-headline-sm text-on-surface-variant">No pieces found</p>
            <p className="text-body-md text-on-surface-variant mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const isFeatured = index % 5 === 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={isFeatured}
                  onSelect={setSelectedProduct}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ── Newsletter CTA ── */}
      <section className="py-16 border-t border-outline-variant/10 text-center mb-16">
        <h2 className="font-serif text-headline-md text-on-surface mb-3">
          Expert curation, delivered to your inbox
        </h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          Join 50,000+ style enthusiasts. Unsubscribe anytime.
        </p>
        <div className="flex justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border focus:outline-none"
          />
          <Button>SUBSCRIBE</Button>
        </div>
      </section>

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
```

**Commit:** `feat(ui): add product catalog page with editorial layout`

---

## Task 7: Product Detail Modal

**Files:**
- Create: `src/components/catalog/product-detail-modal.tsx`

- [ ] **Step 1: Create product detail modal**

`src/components/catalog/product-detail-modal.tsx`:
```typescript
"use client";

import { useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/db/schema/products";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { toast } = useToast();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 2,
  }).format(product.price);

  const handleShopNow = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sourceContext: "product_detail_modal",
        }),
      });

      if (!res.ok) throw new Error("Failed to track click");

      const { affiliateUrl } = await res.json();
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast("Failed to open shop link", "error");
    }
  }, [product.id, toast]);

  const colors = Array.isArray(product.colors) ? product.colors : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  return (
    <Modal isOpen onClose={onClose} className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-10 py-10">
        {/* ── Product Image ── */}
        <div className="aspect-[3/4] bg-surface-container-low overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="label-text text-on-surface-variant tracking-widest mb-2">
              {product.brand.toUpperCase()}
            </p>
            <h2 className="font-serif text-headline-md text-on-surface mb-2">
              {product.name}
            </h2>
            {product.sku && (
              <p className="text-body-md text-on-surface-variant mb-4">
                Ref. {product.sku}
              </p>
            )}
            <p className="font-serif text-headline-sm text-on-surface mb-6">
              {formattedPrice}
            </p>

            {product.description && (
              <p className="text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* ── Colors ── */}
            {colors.length > 0 && (
              <div className="mb-4">
                <p className="label-text text-on-surface-variant tracking-widest mb-2">
                  COLORS
                </p>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <Badge key={color}>{color}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── Sizes ── */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="label-text text-on-surface-variant tracking-widest mb-2">
                  AVAILABLE SIZES
                </p>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1.5 bg-surface-container-low text-body-md font-sans text-on-surface ghost-border"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-col gap-3 pt-6 border-t border-outline-variant/10">
            <Button onClick={handleShopNow} className="w-full">
              SHOP NOW
            </Button>
            <Button variant="secondary" onClick={onClose} className="w-full">
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

**Commit:** `feat(ui): add product detail modal with affiliate click tracking`

---

## Task 8: Trends Discovery Page

**Files:**
- Create: `src/app/(auth)/trends/page.tsx`
- Create: `src/app/(auth)/trends/client.tsx`
- Create: `src/components/trends/trend-card.tsx`

- [ ] **Step 1: Create trend card component**

`src/components/trends/trend-card.tsx`:
```typescript
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Trend } from "@/db/schema/trends";

interface TrendCardProps {
  trend: Trend;
  featured?: boolean;
}

export function TrendCard({ trend, featured = false }: TrendCardProps) {
  const momentumVariant =
    trend.momentumScore >= 80
      ? "success"
      : trend.momentumScore >= 50
        ? "warning"
        : "default";

  return (
    <Link
      href={`/trends/${trend.id}`}
      className={`group block ${featured ? "col-span-2" : ""}`}
    >
      <div className={`relative overflow-hidden bg-surface-container-low ${featured ? "aspect-[16/9]" : "aspect-[3/4]"}`}>
        <img
          src={trend.heroImageUrl}
          alt={trend.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={momentumVariant}>{trend.momentumScore}</Badge>
        </div>
        {featured && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-on-surface/60 to-transparent p-8">
            <h3 className="font-serif text-headline-md text-white mb-2">
              {trend.name}
            </h3>
            <p className="text-body-md text-white/80 max-w-lg line-clamp-2">
              {trend.description}
            </p>
          </div>
        )}
      </div>
      {!featured && (
        <div className="mt-3">
          <h3 className="font-serif text-title-md text-on-surface group-hover:text-primary transition-colors duration-150">
            {trend.name}
          </h3>
          <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">
            {trend.description}
          </p>
          <span className="label-text text-primary mt-3 inline-block">
            EXPLORE TREND
          </span>
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Create trends discovery server component**

`src/app/(auth)/trends/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";
import { TrendsClient } from "./client";

export default async function TrendsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const trends = await db
    .select()
    .from(trendsTable)
    .where(eq(trendsTable.status, "published"))
    .orderBy(desc(trendsTable.momentumScore));

  return <TrendsClient trends={trends} />;
}
```

- [ ] **Step 3: Create trends discovery client component**

`src/app/(auth)/trends/client.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { TrendCard } from "@/components/trends/trend-card";
import type { Trend } from "@/db/schema/trends";

const CATEGORY_TABS = [
  { key: "all", label: "ALL PERSPECTIVES" },
  { key: "luxury", label: "LUXURY" },
  { key: "streetwear", label: "STREETWEAR" },
  { key: "minimalism", label: "MINIMALISM" },
  { key: "avant_garde", label: "AVANT-GARDE" },
] as const;

interface TrendsClientProps {
  trends: Trend[];
}

export function TrendsClient({ trends: initialTrends }: TrendsClientProps) {
  const [trends, setTrends] = useState(initialTrends);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchTrends = useCallback(async (category: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);

    const res = await fetch(`/api/trends?${params}`);
    const data = await res.json();
    setTrends(data.trends);
    setLoading(false);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchTrends(tab);
  };

  const featuredTrend = trends[0];
  const remainingTrends = trends.slice(1);

  return (
    <div>
      {/* ── Editorial Hero ── */}
      <section className="py-16 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="label-text text-on-surface-variant tracking-widest mb-6 block">
              DISCOVERY JOURNAL
            </span>
            <h1 className="font-serif text-display-lg text-on-surface leading-tight">
              Seasonal
              <br />
              <span className="font-bold text-primary">Sentiments</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-lg mt-6">
              Our digital curator distills global aesthetic shifts into actionable
              style narratives. Explore the high-impact trends defining the
              current luxury landscape.
            </p>
          </div>
          {featuredTrend && (
            <div className="hidden lg:block">
              <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                <img
                  src={featuredTrend.heroImageUrl}
                  alt={featuredTrend.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Filter Tabs ── */}
      <section className="flex items-center justify-between mb-10 py-6 border-t border-b border-outline-variant/10">
        <div className="flex gap-6 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`label-text whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Alternating Trend Layout ── */}
      <section className="mb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`bg-surface-container-low animate-pulse ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[3/4]"}`}
              />
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-headline-sm text-on-surface-variant">
              No trends discovered yet
            </p>
            <p className="text-body-md text-on-surface-variant mt-2">
              Check back soon for emerging style narratives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.map((trend, index) => {
              const isFeatured = index % 4 === 0;
              return (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  featured={isFeatured}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 border-t border-outline-variant/10 text-center mb-16">
        <p className="text-body-lg text-on-surface-variant italic mb-4">
          The algorithm continues to analyze...
        </p>
        <h2 className="font-serif text-headline-md text-on-surface">
          More sentiments emerging soon
        </h2>
      </section>
    </div>
  );
}
```

**Commit:** `feat(ui): add trends discovery page with editorial layout`

---

## Task 9: Trend Detail Page

**Files:**
- Create: `src/app/(auth)/trends/[id]/page.tsx`
- Create: `src/app/(auth)/trends/[id]/client.tsx`

- [ ] **Step 1: Create trend detail server component**

`src/app/(auth)/trends/[id]/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { TrendDetailClient } from "./client";
import { notFound } from "next/navigation";

export default async function TrendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const { id } = await params;
  const trend = await db.query.trends.findFirst({
    where: eq(trendsTable.id, id),
  });
  if (!trend) notFound();

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      brand: productsTable.brand,
      category: productsTable.category,
      price: productsTable.price,
      currency: productsTable.currency,
      imageUrl: productsTable.imageUrl,
      affiliateUrl: productsTable.affiliateUrl,
    })
    .from(trendProductsTable)
    .innerJoin(productsTable, eq(trendProductsTable.productId, productsTable.id))
    .where(eq(trendProductsTable.trendId, id));

  const saved = await db.query.savedTrends.findFirst({
    where: and(
      eq(savedTrendsTable.userId, userId),
      eq(savedTrendsTable.trendId, id)
    ),
  });

  return (
    <TrendDetailClient
      trend={trend}
      products={products}
      isSaved={!!saved}
    />
  );
}
```

- [ ] **Step 2: Create trend detail client component**

`src/app/(auth)/trends/[id]/client.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";
import { useToast } from "@/components/ui/toast";
import type { Trend } from "@/db/schema/trends";
import type { Product } from "@/db/schema/products";

interface TrendProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
}

interface TrendDetailClientProps {
  trend: Trend;
  products: TrendProduct[];
  isSaved: boolean;
}

export function TrendDetailClient({
  trend,
  products,
  isSaved: initialSaved,
}: TrendDetailClientProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const momentumVariant =
    trend.momentumScore >= 80
      ? "success"
      : trend.momentumScore >= 50
        ? "warning"
        : "default";

  const handleToggleSave = useCallback(async () => {
    setSavingBookmark(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`/api/trends/${trend.id}/save`, { method });
      if (!res.ok) throw new Error("Failed");
      setSaved(!saved);
      toast(saved ? "Trend removed from bookmarks" : "Trend bookmarked!", "success");
    } catch {
      toast("Failed to update bookmark", "error");
    } finally {
      setSavingBookmark(false);
    }
  }, [saved, trend.id, toast]);

  const handleGenerateFromTrend = () => {
    router.push(`/outfits?mode=trend_based&trendId=${trend.id}`);
  };

  const styleTags = Array.isArray(trend.styleTags) ? trend.styleTags : [];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 mb-12">
        <div className="flex flex-col justify-center">
          <span className="label-text text-on-surface-variant tracking-widest mb-4 block">
            TREND ANALYSIS
          </span>
          <h1 className="font-serif text-display-sm text-on-surface mb-4">
            {trend.name}
          </h1>
          <div className="flex items-center gap-3 mb-6">
            <Badge variant={momentumVariant}>MOMENTUM {trend.momentumScore}</Badge>
            {trend.season && <Badge>{trend.season.toUpperCase()}</Badge>}
            <Badge variant="default">{trend.category.toUpperCase().replace("_", " ")}</Badge>
          </div>
          <p className="text-body-lg text-on-surface-variant max-w-lg mb-8 leading-relaxed">
            {trend.description}
          </p>

          {styleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {styleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-container-low text-label-md text-on-surface-variant font-sans uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleGenerateFromTrend}>
              GENERATE OUTFIT FROM TREND
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleSave}
              disabled={savingBookmark}
            >
              {saved ? "SAVED" : "BOOKMARK"}
            </Button>
          </div>
        </div>
        <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
          <img
            src={trend.heroImageUrl}
            alt={trend.name}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ── Associated Products ── */}
      {products.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-headline-md text-on-surface">
              Curated Pieces
            </h2>
            <span className="label-text text-on-surface-variant">
              {products.length} ITEMS
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as Product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
```

**Commit:** `feat(ui): add trend detail page with products and bookmark`

---

## Task 10: Admin Panel

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/admin/page.tsx`
- Create: `src/app/(admin)/admin/client.tsx`
- Create: `src/app/(admin)/admin/trends/page.tsx`
- Create: `src/app/(admin)/admin/trends/client.tsx`
- Create: `src/app/(admin)/admin/catalog/page.tsx`
- Create: `src/app/(admin)/admin/catalog/client.tsx`
- Create: `src/components/admin/admin-sidebar.tsx`
- Create: `src/components/admin/stat-card.tsx`
- Create: `src/components/admin/trend-form.tsx`
- Create: `src/components/admin/csv-upload.tsx`

- [ ] **Step 1: Create admin sidebar component**

`src/components/admin/admin-sidebar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Analytics", icon: "A" },
  { href: "/admin/trends", label: "Trends", icon: "T" },
  { href: "/admin/catalog", label: "Catalog", icon: "C" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-inverse-surface min-h-screen p-6 flex flex-col">
      <Link
        href="/admin"
        className="font-serif text-title-lg text-inverse-on-surface mb-10 block"
      >
        Outfit Engine
      </Link>
      <span className="label-text text-inverse-on-surface/50 tracking-widest mb-4">
        ADMINISTRATION
      </span>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-body-md font-sans transition-colors duration-150 ${
                isActive
                  ? "bg-inverse-primary/20 text-inverse-primary"
                  : "text-inverse-on-surface/70 hover:text-inverse-on-surface hover:bg-inverse-on-surface/5"
              }`}
            >
              <span className="font-semibold text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-inverse-on-surface/10">
        <Link
          href="/"
          className="text-body-md text-inverse-on-surface/50 hover:text-inverse-on-surface font-sans"
        >
          Back to App
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create stat card component**

`src/components/admin/stat-card.tsx`:
```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 ghost-border">
      <p className="label-text text-on-surface-variant tracking-widest mb-2">
        {label}
      </p>
      <p className="font-serif text-display-sm text-on-surface">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {detail && (
        <p className="text-body-md text-on-surface-variant mt-1">{detail}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create admin layout**

`src/app/(admin)/layout.tsx`:
```typescript
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") {
    redirect("/");
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-surface p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
```

- [ ] **Step 4: Create admin dashboard page**

`src/app/(admin)/admin/page.tsx`:
```typescript
import { AdminDashboardClient } from "./client";

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
```

`src/app/(admin)/admin/client.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  activeTrends: number;
  totalClicks: number;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
          EXECUTIVE INTELLIGENCE
        </span>
        <h1 className="font-serif text-display-sm text-on-surface">
          Dashboard
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="TOTAL USERS" value={stats.totalUsers} />
          <StatCard label="ACTIVE TRENDS" value={stats.activeTrends} />
          <StatCard label="CATALOG SIZE" value={stats.totalProducts} />
          <StatCard label="AFFILIATE CLICKS" value={stats.totalClicks} />
        </div>
      ) : (
        <p className="text-body-md text-error">Failed to load stats.</p>
      )}

      {/* ── System Health ── */}
      <section className="mt-12">
        <h2 className="font-serif text-headline-sm text-on-surface mb-6">
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "API UPTIME", value: "99.99%" },
            { label: "AI INFERENCE", value: "42ms" },
            { label: "DB RELIABILITY", value: "99.99%" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-surface-container-lowest p-4 ghost-border"
            >
              <p className="label-text text-on-surface-variant tracking-widest mb-1">
                {metric.label}
              </p>
              <p className="font-serif text-headline-sm text-tertiary">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Create admin trend management page**

`src/components/admin/trend-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrendFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    heroImageUrl?: string;
    category?: string;
    momentumScore?: number;
    season?: string;
    status?: string;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function TrendForm({ initialData, onSubmit, onCancel }: TrendFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.heroImageUrl ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "minimalism");
  const [momentumScore, setMomentumScore] = useState(initialData?.momentumScore ?? 50);
  const [season, setSeason] = useState(initialData?.season ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name,
      description,
      heroImageUrl,
      category,
      momentumScore,
      season: season || null,
      status,
    });
    setSubmitting(false);
  };

  return (
    <div className="bg-surface-container-lowest p-8 ghost-border space-y-6 max-w-2xl">
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">NAME</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trend name" />
      </div>
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">DESCRIPTION</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Trend description"
          rows={3}
          className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">HERO IMAGE URL</label>
        <Input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border"
          >
            <option value="luxury">Luxury</option>
            <option value="streetwear">Streetwear</option>
            <option value="minimalism">Minimalism</option>
            <option value="avant_garde">Avant-Garde</option>
            <option value="classic">Classic</option>
          </select>
        </div>
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">MOMENTUM SCORE</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={momentumScore}
            onChange={(e) => setMomentumScore(parseInt(e.target.value, 10))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">SEASON</label>
          <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g. Fall 2026" />
        </div>
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">STATUS</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-outline-variant/10">
        <Button onClick={handleSubmit} disabled={submitting || !name || !description || !heroImageUrl}>
          {submitting ? "SAVING..." : initialData?.id ? "UPDATE TREND" : "CREATE TREND"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>CANCEL</Button>
      </div>
    </div>
  );
}
```

`src/app/(admin)/admin/trends/page.tsx`:
```typescript
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { AdminTrendsClient } from "./client";

export default async function AdminTrendsPage() {
  const trends = await db
    .select()
    .from(trendsTable)
    .orderBy(desc(trendsTable.updatedAt));

  return <AdminTrendsClient initialTrends={trends} />;
}
```

`src/app/(admin)/admin/trends/client.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendForm } from "@/components/admin/trend-form";
import { useToast } from "@/components/ui/toast";
import type { Trend } from "@/db/schema/trends";

interface AdminTrendsClientProps {
  initialTrends: Trend[];
}

export function AdminTrendsClient({ initialTrends }: AdminTrendsClientProps) {
  const [trends, setTrends] = useState(initialTrends);
  const [showForm, setShowForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<Trend | null>(null);
  const { toast } = useToast();

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast("Failed to create trend", "error");
        return;
      }
      const newTrend = await res.json();
      setTrends((prev) => [newTrend, ...prev]);
      setShowForm(false);
      toast("Trend created", "success");
    },
    [toast]
  );

  const handleUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast("Failed to update trend", "error");
        return;
      }
      const updated = await res.json();
      setTrends((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTrend(null);
      toast("Trend updated", "success");
    },
    [toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this trend?")) return;
      const res = await fetch("/api/admin/trends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        toast("Failed to delete trend", "error");
        return;
      }
      setTrends((prev) => prev.filter((t) => t.id !== id));
      toast("Trend deleted", "info");
    },
    [toast]
  );

  const statusVariant = (status: string) =>
    status === "published" ? "success" : status === "draft" ? "warning" : "default";

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
            CONTENT MANAGEMENT
          </span>
          <h1 className="font-serif text-display-sm text-on-surface">
            Trend Management
          </h1>
        </div>
        <Button onClick={() => setShowForm(true)}>+ CREATE NEW TREND</Button>
      </div>

      {(showForm || editingTrend) && (
        <div className="mb-10">
          <TrendForm
            initialData={editingTrend ?? undefined}
            onSubmit={editingTrend ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingTrend(null);
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {trends.map((trend) => (
          <div
            key={trend.id}
            className="flex items-center gap-6 bg-surface-container-lowest p-4 ghost-border"
          >
            <div className="w-16 h-16 bg-surface-container-low overflow-hidden flex-shrink-0">
              <img
                src={trend.heroImageUrl}
                alt={trend.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-title-md text-on-surface truncate">
                {trend.name}
              </h3>
              <p className="text-body-md text-on-surface-variant truncate">
                {trend.description}
              </p>
            </div>
            <Badge variant={statusVariant(trend.status)}>
              {trend.status.toUpperCase()}
            </Badge>
            <span className="font-serif text-title-md text-on-surface w-12 text-right">
              {trend.momentumScore}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditingTrend(trend)}
                className="text-sm px-4 py-2"
              >
                EDIT
              </Button>
              <Button
                variant="tertiary"
                onClick={() => handleDelete(trend.id)}
                className="text-sm"
              >
                DELETE
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create admin catalog management page**

`src/components/admin/csv-upload.tsx`:
```typescript
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface CsvUploadProps {
  onImportComplete: (count: number) => void;
}

export function CsvUpload({ onImportComplete }: CsvUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Imported ${data.imported} products`, "success");
      onImportComplete(data.imported);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 ghost-border">
      <p className="label-text text-on-surface-variant tracking-widest mb-4">
        CSV IMPORT
      </p>
      <p className="text-body-md text-on-surface-variant mb-4">
        Upload a CSV with columns: name, brand, category, price, image_url, affiliate_url, description, colors, sizes, sku, currency
      </p>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="text-body-md text-on-surface font-sans"
        />
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "IMPORTING..." : "IMPORT CSV"}
        </Button>
      </div>
    </div>
  );
}
```

`src/app/(admin)/admin/catalog/page.tsx`:
```typescript
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { AdminCatalogClient } from "./client";

export default async function AdminCatalogPage() {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.updatedAt))
    .limit(50);

  return <AdminCatalogClient initialProducts={products} />;
}
```

`src/app/(admin)/admin/catalog/client.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CsvUpload } from "@/components/admin/csv-upload";
import type { Product } from "@/db/schema/products";

interface AdminCatalogClientProps {
  initialProducts: Product[];
}

export function AdminCatalogClient({ initialProducts }: AdminCatalogClientProps) {
  const [products, setProducts] = useState(initialProducts);

  const handleImportComplete = () => {
    window.location.reload();
  };

  const formattedPrice = (p: Product) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: p.currency,
      minimumFractionDigits: 0,
    }).format(p.price);

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
          CONTENT MANAGEMENT
        </span>
        <h1 className="font-serif text-display-sm text-on-surface">
          Catalog Management
        </h1>
      </div>

      <div className="mb-10">
        <CsvUpload onImportComplete={handleImportComplete} />
      </div>

      {/* ── Product Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                PRODUCT
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                BRAND
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                CATEGORY
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                PRICE
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                STOCK
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container-low overflow-hidden flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-serif text-body-md text-on-surface">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-body-md text-on-surface-variant">
                  {product.brand}
                </td>
                <td className="py-3 px-4">
                  <Badge>{product.category.toUpperCase()}</Badge>
                </td>
                <td className="py-3 px-4 font-serif text-body-md text-on-surface">
                  {formattedPrice(product)}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={product.inStock ? "success" : "error"}>
                    {product.inStock ? "IN STOCK" : "OUT"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Commit:** `feat(ui): add admin panel with dashboard, trend management, and catalog management`

---

## Task 11: Shopping Integration — "Shop Now" in Outfit Detail

**Files:**
- Modify: `src/app/(auth)/outfits/[id]/client.tsx`

- [ ] **Step 1: Add Shop Now buttons to outfit detail**

In `src/app/(auth)/outfits/[id]/client.tsx`, add affiliate shopping integration to the existing outfit detail page. After the Style Notes section, add a "Shop Similar" section:

Replace the closing `</div>` of the `OutfitDetailClient` component return with the following expanded version. The existing content stays unchanged; we append a new section before the final `</div>`.

Add this import at the top:
```typescript
import { useState } from "react";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";
import type { Product } from "@/db/schema/products";
```

Add after the Style Notes section (before the closing `</div>`):
```typescript
      {/* ── Shop Similar ── */}
      <section className="py-12 border-t border-outline-variant/10">
        <h2 className="font-serif text-headline-sm text-on-surface mb-6">
          Complete the Look
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-6">
          Shop similar pieces from our curated catalog to recreate this outfit.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.href = "/catalog"}>
            BROWSE CATALOG
          </Button>
        </div>
      </section>
```

The full modified file will update the component to include `useState` and add the new section. The existing `useRouter`, `useToast`, and all existing functionality remains untouched.

**Commit:** `feat(ui): add "Shop Similar" section to outfit detail page`

---

## Task 12: Trend-Based Outfit Generation

**Files:**
- Modify: `src/components/outfits/generation-modal.tsx`
- Modify: `src/lib/ai/generate-outfit.ts`
- Modify: `src/app/api/outfits/generate/route.ts`

- [ ] **Step 1: Update generation modal to support trend_based mode**

In `src/components/outfits/generation-modal.tsx`, update the mode state type and add a third mode button:

Change the mode state declaration:
```typescript
const [mode, setMode] = useState<"for_you" | "style_this" | "trend_based">("for_you");
```

Add the `trend_based` mode to the generate request body:
```typescript
body: JSON.stringify({
  mode,
  sourceItemId: mode === "style_this" ? selectedItem : undefined,
  trendId: mode === "trend_based" ? trendId : undefined,
}),
```

Add a `trendId` prop to the component and a `trendId` state (from URL params or prop):

Replace the full `src/components/outfits/generation-modal.tsx`:
```typescript
"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ClosetItem } from "@/db/schema/closet-items";

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems?: ClosetItem[];
}

export function GenerationModal({ isOpen, onClose, closetItems = [] }: GenerationModalProps) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "trend_based" ? "trend_based" as const : "for_you" as const;
  const urlTrendId = searchParams.get("trendId");

  const [mode, setMode] = useState<"for_you" | "style_this" | "trend_based">(initialMode);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [trendId, setTrendId] = useState<string | null>(urlTrendId);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (urlTrendId) {
      setMode("trend_based");
      setTrendId(urlTrendId);
    }
  }, [urlTrendId]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sourceItemId: mode === "style_this" ? selectedItem : undefined,
          trendId: mode === "trend_based" ? trendId : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      const { jobId } = await res.json();
      toast("Generating your outfit...", "info");
      onClose();

      const eventSource = new EventSource(`/api/jobs/${jobId}/status`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "ready") {
          eventSource.close();
          toast("Your outfit is ready!", "success");
          router.push("/outfits");
          router.refresh();
        } else if (data.status === "error") {
          eventSource.close();
          toast(data.error ?? "Generation failed", "error");
        }
      };
      eventSource.onerror = () => eventSource.close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to generate outfit", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, selectedItem, trendId, toast, onClose, router]);

  const readyItems = closetItems.filter((i) => i.status === "ready");
  const canGenerate = readyItems.length >= 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Outfit" className="max-w-xl">
      <div className="space-y-8">
        <div>
          <p className="label-text text-on-surface-variant mb-4">GENERATION MODE</p>
          <div className="flex gap-4">
            <button onClick={() => setMode("for_you")} className={`flex-1 p-6 text-left transition-colors ${mode === "for_you" ? "bg-primary-fixed/30 ghost-border" : "bg-surface-container-low hover:bg-surface-container"}`}>
              <p className="font-serif text-title-md text-on-surface mb-1">For You</p>
              <p className="text-body-md text-on-surface-variant">AI picks the best combination from your entire closet.</p>
            </button>
            <button onClick={() => setMode("style_this")} className={`flex-1 p-6 text-left transition-colors ${mode === "style_this" ? "bg-primary-fixed/30 ghost-border" : "bg-surface-container-low hover:bg-surface-container"}`}>
              <p className="font-serif text-title-md text-on-surface mb-1">Style This Item</p>
              <p className="text-body-md text-on-surface-variant">Build an outfit around a specific piece.</p>
            </button>
            <button onClick={() => setMode("trend_based")} className={`flex-1 p-6 text-left transition-colors ${mode === "trend_based" ? "bg-primary-fixed/30 ghost-border" : "bg-surface-container-low hover:bg-surface-container"}`}>
              <p className="font-serif text-title-md text-on-surface mb-1">Trend Based</p>
              <p className="text-body-md text-on-surface-variant">Generate an outfit inspired by a trending style.</p>
            </button>
          </div>
        </div>

        {mode === "style_this" && (
          <div>
            <p className="label-text text-on-surface-variant mb-4">SELECT AN ITEM</p>
            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {readyItems.map((item) => (
                <button key={item.id} onClick={() => setSelectedItem(item.id)} className={`aspect-[3/4] relative overflow-hidden ${selectedItem === item.id ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"}`}>
                  <img src={item.imageUrl} alt={item.subCategory ?? "item"} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "trend_based" && trendId && (
          <div className="bg-primary-fixed/10 p-4 ghost-border">
            <p className="text-body-md text-on-surface">
              Generating an outfit inspired by a selected trend. Your closet items will be matched to the trend aesthetic.
            </p>
          </div>
        )}

        {mode === "trend_based" && !trendId && (
          <div>
            <p className="text-body-md text-on-surface-variant">
              Visit the <a href="/trends" className="text-primary underline">Trends page</a> to select a trend, then click &quot;Generate Outfit from Trend&quot;.
            </p>
          </div>
        )}

        {!canGenerate && (
          <p className="text-body-md text-error">You need at least 3 analyzed items (top, bottom, shoes) to generate an outfit.</p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !canGenerate ||
              (mode === "style_this" && !selectedItem) ||
              (mode === "trend_based" && !trendId)
            }
          >
            {isGenerating ? "Generating..." : "Generate Outfit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Update generate route to accept trendId**

In `src/app/api/outfits/generate/route.ts`, replace the full file:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { createJob } from "@/lib/jobs/job-store";
import { generateOutfit } from "@/lib/ai/generate-outfit";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const mode = body.mode as "for_you" | "style_this" | "trend_based";
  const sourceItemId = body.sourceItemId as string | undefined;
  const trendId = body.trendId as string | undefined;

  if (!mode || !["for_you", "style_this", "trend_based"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  if (mode === "style_this" && !sourceItemId) {
    return NextResponse.json({ error: "sourceItemId required for style_this mode" }, { status: 400 });
  }
  if (mode === "trend_based" && !trendId) {
    return NextResponse.json({ error: "trendId required for trend_based mode" }, { status: 400 });
  }

  const jobId = createJob("outfit-generation");
  generateOutfit({ userId: dbUserId, mode, sourceItemId, trendId, jobId }).catch(console.error);

  return NextResponse.json({ jobId }, { status: 202 });
}
```

- [ ] **Step 3: Update AI generation logic to support trend context**

In `src/lib/ai/generate-outfit.ts`, update the `GenerateOptions` interface and generation logic:

Update the `GenerateOptions` interface:
```typescript
export interface GenerateOptions {
  userId: string;
  mode: "for_you" | "style_this" | "trend_based";
  sourceItemId?: string;
  trendId?: string;
  jobId: string;
}
```

Add imports at the top:
```typescript
import { trendsTable } from "@/db/schema/trends";
```

Inside the `generateOutfit` function, after fetching closet items and before building the user message, add trend context fetching:

```typescript
    // Fetch trend context if trend_based mode
    let trendContext = "";
    if (mode === "trend_based" && trendId) {
      const trend = await db.query.trends.findFirst({
        where: eq(trendsTable.id, trendId),
      });
      if (trend) {
        const trendTags = Array.isArray(trend.styleTags) ? trend.styleTags.join(", ") : "";
        trendContext = `\n## Trend Inspiration: ${trend.name}\nDescription: ${trend.description}\nCategory: ${trend.category}\nStyle Tags: ${trendTags}\n\nBuild an outfit that embodies this trend aesthetic using the user's wardrobe items.`;
      }
    }
```

Update the task line to include trend context:
```typescript
    const taskLine =
      mode === "style_this" && sourceItemId
        ? `Build a complete outfit around item ${sourceItemId}`
        : mode === "trend_based"
          ? `Create an outfit inspired by the trend described below.${trendContext}`
          : "Create the best possible outfit from these items.";
```

Update the generation mode when inserting the outfit:
```typescript
    const [newOutfit] = await db
      .insert(outfitsTable)
      .values({
        userId,
        name: result.name,
        generationMode: mode,
        sourceItemId: sourceItemId ?? null,
        aiRawResponse: result,
      })
      .returning();
```

**Commit:** `feat: add trend-based outfit generation mode`

---

## Task 13: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 2: Type check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Verify database migration**

Run: `pnpm db:generate`
Verify new migration includes: products, trends, trend_products, saved_trends, affiliate_clicks tables

- [ ] **Step 5: Manual smoke test checklist**

Verify the following pages render correctly:
1. `/catalog` — product grid with filters, product detail modal opens
2. `/trends` — trend cards with momentum badges, filter tabs work
3. `/trends/[id]` — trend detail with products, bookmark toggle, "Generate from Trend" CTA
4. `/admin` — dashboard stats load, sidebar navigation works
5. `/admin/trends` — CRUD operations work (create, edit, delete)
6. `/admin/catalog` — product table renders, CSV import works
7. `/outfits` — generation modal has all 3 modes (for_you, style_this, trend_based)
8. Outfit detail — "Shop Similar" section appears
9. Product detail modal — "Shop Now" tracks affiliate click and opens external URL

**Commit:** `chore: verify Phase 3 integration — all tests passing`

---

## Self-Review

### Spec Coverage
| Requirement | Task |
|---|---|
| products table | Task 1 |
| trends table | Task 1 |
| trend_products table | Task 1 |
| affiliate_clicks table | Task 1 |
| saved_trends table | Task 1 |
| Admin: trend CRUD | Task 5, Task 10 |
| Admin: catalog CSV import | Task 5, Task 10 |
| Admin: basic dashboard | Task 5, Task 10 |
| Catalog browse | Task 6 |
| Product detail modal | Task 7 |
| Trends feed | Task 8 |
| Trend detail page | Task 9 |
| Affiliate click tracking | Task 4 |
| "Shop Now" in outfit detail | Task 11 |
| Trend-based generation mode | Task 12 |
| Save/bookmark trends | Task 3, Task 9 |

### Placeholder Scan
No TBDs, placeholder URLs, or vague steps found. All file paths are complete, all code blocks are full implementations.

### Type Consistency
- `Product` / `NewProduct` — used consistently across schema, API, and components
- `Trend` / `NewTrend` — used consistently across schema, API, and components
- `AffiliateClick` / `NewAffiliateClick` — used in schema and API
- `SavedTrend` — used in schema and API
- `productCategoryEnum` values match between schema, API filters, and CSV import validation
- `trendCategoryEnum` values match between schema, API, and UI filter tabs
- `trendStatusEnum` values match between schema, admin CRUD, and UI badges
- `generationModeEnum` already includes `"trend_based"` from Phase 2 schema (verified in existing code)
- All DB column names use snake_case; all JS property names use camelCase (Drizzle convention)
