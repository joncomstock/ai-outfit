# Capsule Wardrobe Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate AI-powered capsule wardrobes from a user's closet — curated collections of 5-7 versatile pieces that maximize outfit combinations, with gap analysis identifying what to shop for next.

**Architecture:** A new `capsules` table stores generated capsule wardrobes with a `capsule_outfits` join table linking to existing outfits. Claude generates capsule selections by analyzing the user's full closet metadata, identifying versatile pieces, suggesting outfit combinations, and flagging wardrobe gaps. API endpoints handle generation (async via job system), listing, and detail retrieval. Pages follow the existing server/client split pattern.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Anthropic Claude API, Tailwind CSS 4, Vitest

---

## File Structure

```
src/
├── db/
│   ├── schema/
│   │   └── capsules.ts                             # NEW: capsules + capsule_outfits tables
│   └── index.ts                                    # MODIFY: Register capsule tables
├── lib/
│   └── ai/
│       └── generate-capsule.ts                     # NEW: Claude capsule generation
├── app/
│   ├── api/
│   │   └── capsules/
│   │       ├── route.ts                            # NEW: GET list capsules
│   │       ├── generate/
│   │       │   └── route.ts                        # NEW: POST generate capsule
│   │       └── [id]/
│   │           └── route.ts                        # NEW: GET capsule detail
│   └── (auth)/
│       └── capsules/
│           ├── page.tsx                            # NEW: Capsule list (server)
│           ├── client.tsx                          # NEW: Capsule list (client)
│           └── [id]/
│               ├── page.tsx                        # NEW: Capsule detail (server)
│               └── client.tsx                      # NEW: Capsule detail (client)
├── components/
│   ├── capsules/
│   │   ├── capsule-card.tsx                        # NEW: Capsule preview card
│   │   ├── capsule-pieces.tsx                      # NEW: Piece grid display
│   │   └── gap-analysis.tsx                        # NEW: Gap analysis with shop CTA
│   └── layout/
│       └── nav.tsx                                 # MODIFY: Add Capsules nav link
tests/
├── db/
│   └── capsules-schema.test.ts                     # NEW
├── lib/
│   └── ai/
│       └── generate-capsule.test.ts                # NEW
├── api/
│   └── capsules/
│       ├── generate.test.ts                        # NEW
│       ├── list.test.ts                            # NEW
│       └── detail.test.ts                          # NEW
```

---

## Task 1: Capsule Schema

**Files:**
- Create: `src/db/schema/capsules.ts`
- Modify: `src/db/index.ts`
- Test: `tests/db/capsules-schema.test.ts`

- [ ] **Step 1: Write failing test**

`tests/db/capsules-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";

describe("capsules schema", () => {
  it("capsulesTable has expected columns", () => {
    const columns = Object.keys(capsulesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("name");
    expect(columns).toContain("description");
    expect(columns).toContain("season");
    expect(columns).toContain("theme");
    expect(columns).toContain("pieces");
    expect(columns).toContain("gapAnalysis");
    expect(columns).toContain("aiRawResponse");
    expect(columns).toContain("createdAt");
  });

  it("capsuleOutfitsTable has expected columns", () => {
    const columns = Object.keys(capsuleOutfitsTable);
    expect(columns).toContain("id");
    expect(columns).toContain("capsuleId");
    expect(columns).toContain("outfitId");
    expect(columns).toContain("position");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/db/capsules-schema.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create capsules schema**

`src/db/schema/capsules.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { outfitsTable } from "./outfits";

export const capsulesTable = pgTable("capsules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  season: text("season"),
  theme: text("theme"),
  pieces: jsonb("pieces").$type<string[]>().default([]),
  gapAnalysis: jsonb("gap_analysis")
    .$type<Array<{ category: string; description: string; searchQuery: string }>>()
    .default([]),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const capsuleOutfitsTable = pgTable(
  "capsule_outfits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    capsuleId: uuid("capsule_id")
      .notNull()
      .references(() => capsulesTable.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfitsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    uniqueIndex("capsule_outfit_unique").on(table.capsuleId, table.outfitId),
  ],
);

export type Capsule = typeof capsulesTable.$inferSelect;
export type NewCapsule = typeof capsulesTable.$inferInsert;
export type CapsuleOutfit = typeof capsuleOutfitsTable.$inferSelect;
export type NewCapsuleOutfit = typeof capsuleOutfitsTable.$inferInsert;
```

- [ ] **Step 4: Register tables in db/index.ts**

Add to `src/db/index.ts`:

```typescript
import { capsulesTable, capsuleOutfitsTable } from "./schema/capsules";
```

Add to the schema object:

```typescript
capsules: capsulesTable,
capsuleOutfits: capsuleOutfitsTable,
```

- [ ] **Step 5: Push schema**

Run: `pnpm db:push`

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run tests/db/capsules-schema.test.ts`
Expected: PASS — all 2 tests

**Commit:** `feat(db): add capsules and capsule_outfits schema tables`

---

## Task 2: Claude-Powered Capsule Generation

**Files:**
- Create: `src/lib/ai/generate-capsule.ts`
- Test: `tests/lib/ai/generate-capsule.test.ts`

- [ ] **Step 1: Write failing test**

`tests/lib/ai/generate-capsule.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

vi.mock("@/db", () => ({
  db: {
    query: {
      closetItems: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "item-1",
            category: "tops",
            subCategory: "t-shirt",
            colors: ["#FFFFFF"],
            fit: "regular",
            seasonality: ["spring", "summer"],
            styleTags: ["casual", "basics"],
          },
          {
            id: "item-2",
            category: "bottoms",
            subCategory: "jeans",
            colors: ["#1A237E"],
            fit: "slim",
            seasonality: ["all"],
            styleTags: ["casual", "denim"],
          },
          {
            id: "item-3",
            category: "shoes",
            subCategory: "sneakers",
            colors: ["#FFFFFF"],
            fit: "regular",
            seasonality: ["all"],
            styleTags: ["casual", "sporty"],
          },
          {
            id: "item-4",
            category: "outerwear",
            subCategory: "denim-jacket",
            colors: ["#5C6BC0"],
            fit: "regular",
            seasonality: ["spring", "fall"],
            styleTags: ["casual", "layering"],
          },
          {
            id: "item-5",
            category: "tops",
            subCategory: "button-down",
            colors: ["#E8E8E8"],
            fit: "regular",
            seasonality: ["all"],
            styleTags: ["smart-casual", "basics"],
          },
        ]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "capsule-1" }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { userId: "user_id", status: "status" },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: {},
  capsuleOutfitsTable: {},
}));

import { generateCapsule } from "@/lib/ai/generate-capsule";

describe("generateCapsule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends closet metadata to Claude and returns capsule result", async () => {
    const mockResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: "Casual Spring Capsule",
            description: "A versatile 5-piece capsule for everyday spring wear",
            season: "spring",
            theme: "casual",
            selectedItems: ["item-1", "item-2", "item-3", "item-4", "item-5"],
            outfitCombinations: [
              { name: "Weekend Brunch", slots: [{ slotType: "top", closetItemId: "item-1" }, { slotType: "bottom", closetItemId: "item-2" }, { slotType: "shoes", closetItemId: "item-3" }] },
              { name: "Smart Day Out", slots: [{ slotType: "top", closetItemId: "item-5" }, { slotType: "bottom", closetItemId: "item-2" }, { slotType: "shoes", closetItemId: "item-3" }, { slotType: "outerwear", closetItemId: "item-4" }] },
            ],
            gaps: [
              { category: "accessories", description: "A versatile crossbody bag to complete casual looks", searchQuery: "leather crossbody bag" },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValueOnce(mockResponse);

    const result = await generateCapsule({ userId: "user-1" });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.name).toBe("Casual Spring Capsule");
    expect(result.selectedItems).toHaveLength(5);
    expect(result.outfitCombinations).toHaveLength(2);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].category).toBe("accessories");
  });

  it("throws on invalid Claude response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "not valid json" }],
    });

    await expect(generateCapsule({ userId: "user-1" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/lib/ai/generate-capsule.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create capsule generation module**

`src/lib/ai/generate-capsule.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { closetItemsTable } from "@/db/schema/closet-items";

const anthropic = new Anthropic();

export interface CapsuleGenerateOptions {
  userId: string;
  season?: string;
  theme?: string;
}

interface OutfitSlot {
  slotType: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  closetItemId: string;
}

interface OutfitCombination {
  name: string;
  slots: OutfitSlot[];
}

interface GapItem {
  category: string;
  description: string;
  searchQuery: string;
}

export interface CapsuleResult {
  name: string;
  description: string;
  season: string;
  theme: string;
  selectedItems: string[];
  outfitCombinations: OutfitCombination[];
  gaps: GapItem[];
  rawResponse: unknown;
}

const SYSTEM_PROMPT = `You are an expert fashion stylist and wardrobe curator. Create a capsule wardrobe from the user's closet items.

Rules:
- Select 5-7 versatile pieces that maximize outfit combinations
- Each piece should work in at least 2 different outfits
- Consider color harmony, seasonal appropriateness, and style cohesion
- Identify 2-3 wardrobe gaps — items the user should acquire to expand versatility
- Only reference item IDs that exist in the provided list

Return a JSON object with exactly this shape:
{
  "name": "string — a descriptive capsule name",
  "description": "string — 1-2 sentences describing the capsule concept",
  "season": "string — primary season (spring, summer, fall, winter, all)",
  "theme": "string — style theme (casual, smart-casual, workwear, weekend, etc.)",
  "selectedItems": ["item-id-1", "item-id-2", ...],
  "outfitCombinations": [
    {
      "name": "string — outfit name",
      "slots": [
        { "slotType": "top|bottom|shoes|outerwear|accessory", "closetItemId": "item-id" }
      ]
    }
  ],
  "gaps": [
    { "category": "string", "description": "string — what and why", "searchQuery": "string — catalog search terms" }
  ]
}

Return ONLY valid JSON. No markdown, no explanation.`;

export async function generateCapsule(
  options: CapsuleGenerateOptions,
): Promise<CapsuleResult> {
  const { userId, season, theme } = options;

  // Fetch user's ready closet items
  const items = await db.query.closetItems.findMany({
    where: and(
      eq(closetItemsTable.userId, userId),
      eq(closetItemsTable.status, "ready"),
    ),
  });

  if (items.length < 5) {
    throw new Error("Need at least 5 items in your closet to generate a capsule wardrobe");
  }

  // Build item metadata for Claude
  const itemList = items.map((item) => ({
    id: item.id,
    category: item.category,
    subCategory: item.subCategory,
    colors: item.colors,
    fit: item.fit,
    seasonality: item.seasonality,
    styleTags: item.styleTags,
  }));

  const userMessage = [
    `Closet items (${items.length} total):`,
    JSON.stringify(itemList, null, 2),
    season ? `Preferred season: ${season}` : "",
    theme ? `Preferred theme: ${theme}` : "",
    "",
    "Create a capsule wardrobe from these items.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected Claude response type");
  }

  let parsed: CapsuleResult;
  try {
    parsed = JSON.parse(text.text);
  } catch {
    throw new Error("Failed to parse capsule generation response as JSON");
  }

  // Validate all selected item IDs belong to user
  const validIds = new Set(items.map((i) => i.id));
  parsed.selectedItems = parsed.selectedItems.filter((id) => validIds.has(id));
  for (const combo of parsed.outfitCombinations) {
    combo.slots = combo.slots.filter((s) => validIds.has(s.closetItemId));
  }

  parsed.rawResponse = response;

  return parsed;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/lib/ai/generate-capsule.test.ts`
Expected: PASS — all 2 tests

**Commit:** `feat: add Claude-powered capsule wardrobe generation with gap analysis`

---

## Task 3: Capsule API + Generation Endpoint

**Files:**
- Create: `src/app/api/capsules/generate/route.ts`
- Create: `src/app/api/capsules/route.ts`
- Create: `src/app/api/capsules/[id]/route.ts`
- Test: `tests/api/capsules/generate.test.ts`
- Test: `tests/api/capsules/list.test.ts`
- Test: `tests/api/capsules/detail.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/api/capsules/generate.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/capsules/generate/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/lib/jobs/job-store", () => ({
  createJob: vi.fn().mockReturnValue("job-123"),
}));
vi.mock("@/lib/ai/generate-capsule", () => ({
  generateCapsule: vi.fn().mockResolvedValue({
    name: "Test Capsule",
    selectedItems: ["item-1"],
    outfitCombinations: [],
    gaps: [],
  }),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "capsule-1" }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: {},
  capsuleOutfitsTable: {},
}));

describe("POST /api/capsules/generate", () => {
  it("starts capsule generation and returns jobId", async () => {
    const req = new NextRequest("http://localhost/api/capsules/generate", {
      method: "POST",
      body: JSON.stringify({ season: "spring" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.jobId).toBe("job-123");
  });
});
```

`tests/api/capsules/list.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/capsules/route";
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
            { id: "capsule-1", name: "Spring Capsule", season: "spring", createdAt: new Date() },
          ]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: { userId: "user_id", createdAt: "created_at" },
}));

describe("GET /api/capsules", () => {
  it("returns user capsules", async () => {
    const req = new NextRequest("http://localhost/api/capsules");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.capsules).toHaveLength(1);
    expect(body.capsules[0].name).toBe("Spring Capsule");
  });
});
```

`tests/api/capsules/detail.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/capsules/[id]/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));

const mockCapsule = {
  id: "capsule-1",
  userId: "db-user-uuid",
  name: "Spring Capsule",
  description: "A versatile spring collection",
  season: "spring",
  theme: "casual",
  pieces: ["item-1", "item-2"],
  gapAnalysis: [{ category: "shoes", description: "Needs white sneakers", searchQuery: "white sneakers" }],
  createdAt: new Date(),
};

vi.mock("@/db", () => ({
  db: {
    query: {
      capsules: {
        findFirst: vi.fn().mockResolvedValue(mockCapsule),
      },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { outfitId: "outfit-1", outfitName: "Weekend Look", position: 0 },
            ]),
          }),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: { id: "id", userId: "user_id" },
  capsuleOutfitsTable: { capsuleId: "capsule_id", outfitId: "outfit_id", position: "position" },
}));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", name: "name" },
}));

describe("GET /api/capsules/[id]", () => {
  it("returns capsule detail with outfits", async () => {
    const req = new NextRequest("http://localhost/api/capsules/capsule-1");
    const params = Promise.resolve({ id: "capsule-1" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Spring Capsule");
    expect(body.outfits).toHaveLength(1);
    expect(body.gapAnalysis).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/capsules/`
Expected: FAIL — modules not found

- [ ] **Step 3: Create capsule generation endpoint**

`src/app/api/capsules/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { createJob, updateJobStatus } from "@/lib/jobs/job-store";
import { generateCapsule } from "@/lib/ai/generate-capsule";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { season, theme } = body as { season?: string; theme?: string };

  const jobId = createJob("capsule-generation");

  // Run generation asynchronously
  (async () => {
    try {
      updateJobStatus(jobId, { status: "processing", progress: 10 });

      const result = await generateCapsule({ userId: dbUserId, season, theme });
      updateJobStatus(jobId, { status: "processing", progress: 60 });

      // Save capsule to DB
      const [capsule] = await db
        .insert(capsulesTable)
        .values({
          userId: dbUserId,
          name: result.name,
          description: result.description,
          season: result.season,
          theme: result.theme,
          pieces: result.selectedItems,
          gapAnalysis: result.gaps,
          aiRawResponse: result.rawResponse,
        })
        .returning();

      updateJobStatus(jobId, { status: "processing", progress: 80 });

      // Create outfits for each combination and link them
      for (let i = 0; i < result.outfitCombinations.length; i++) {
        const combo = result.outfitCombinations[i];

        const [outfit] = await db
          .insert(outfitsTable)
          .values({
            userId: dbUserId,
            name: combo.name,
            generationMode: "for_you",
          })
          .returning();

        // Create outfit slots
        for (const slot of combo.slots) {
          await db.insert(outfitSlotsTable).values({
            outfitId: outfit.id,
            slotType: slot.slotType,
            closetItemId: slot.closetItemId,
            position: combo.slots.indexOf(slot),
          });
        }

        // Link outfit to capsule
        await db.insert(capsuleOutfitsTable).values({
          capsuleId: capsule.id,
          outfitId: outfit.id,
          position: i,
        });
      }

      updateJobStatus(jobId, {
        status: "complete",
        progress: 100,
        result: { capsuleId: capsule.id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capsule generation failed";
      updateJobStatus(jobId, { status: "error", error: message });
    }
  })().catch(console.error);

  return NextResponse.json({ jobId }, { status: 202 });
}
```

- [ ] **Step 4: Create capsule list endpoint**

`src/app/api/capsules/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable } from "@/db/schema/capsules";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const capsules = await db
    .select()
    .from(capsulesTable)
    .where(eq(capsulesTable.userId, dbUserId))
    .orderBy(desc(capsulesTable.createdAt));

  return NextResponse.json({ capsules });
}
```

- [ ] **Step 5: Create capsule detail endpoint**

`src/app/api/capsules/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const capsule = await db.query.capsules.findFirst({
    where: and(eq(capsulesTable.id, id), eq(capsulesTable.userId, dbUserId)),
  });

  if (!capsule) {
    return NextResponse.json({ error: "Capsule not found" }, { status: 404 });
  }

  // Fetch linked outfits
  const outfits = await db
    .select({
      outfitId: capsuleOutfitsTable.outfitId,
      outfitName: outfitsTable.name,
      position: capsuleOutfitsTable.position,
    })
    .from(capsuleOutfitsTable)
    .innerJoin(outfitsTable, eq(capsuleOutfitsTable.outfitId, outfitsTable.id))
    .where(eq(capsuleOutfitsTable.capsuleId, id))
    .orderBy(capsuleOutfitsTable.position);

  return NextResponse.json({
    ...capsule,
    outfits,
  });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/capsules/`
Expected: PASS — all 3 tests

**Commit:** `feat: add capsule generation, list, and detail API endpoints`

---

## Task 4: Capsule Pages

**Files:**
- Create: `src/app/(auth)/capsules/page.tsx`
- Create: `src/app/(auth)/capsules/client.tsx`
- Create: `src/app/(auth)/capsules/[id]/page.tsx`
- Create: `src/app/(auth)/capsules/[id]/client.tsx`
- Create: `src/components/capsules/capsule-card.tsx`
- Create: `src/components/capsules/capsule-pieces.tsx`
- Create: `src/components/capsules/gap-analysis.tsx`
- Modify: `src/components/layout/nav.tsx`

- [ ] **Step 1: Create capsule list server page**

`src/app/(auth)/capsules/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable } from "@/db/schema/capsules";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CapsulesClient } from "./client";

export const metadata = { title: "Capsule Wardrobes" };

export default async function CapsulesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const capsules = await db
    .select()
    .from(capsulesTable)
    .where(eq(capsulesTable.userId, dbUserId))
    .orderBy(desc(capsulesTable.createdAt));

  return <CapsulesClient capsules={capsules} />;
}
```

- [ ] **Step 2: Create capsule list client component**

`src/app/(auth)/capsules/client.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Capsule } from "@/db/schema/capsules";
import { CapsuleCard } from "@/components/capsules/capsule-card";
import { EmptyState } from "@/components/empty-state";

interface Props {
  capsules: Capsule[];
}

export function CapsulesClient({ capsules: initialCapsules }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/capsules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { jobId } = await res.json();
        // Poll job status — reuse existing SSE pattern
        router.push(`/capsules?generating=${jobId}`);
        router.refresh();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-display-sm text-on-surface">
          Capsule Wardrobes
        </h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Capsule"}
        </button>
      </div>

      {initialCapsules.length === 0 ? (
        <EmptyState
          title="No capsule wardrobes yet"
          description="Generate your first capsule wardrobe to see curated outfit combinations from your closet."
          actionLabel="Generate Capsule"
          onAction={handleGenerate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCapsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create CapsuleCard component**

`src/components/capsules/capsule-card.tsx`:
```typescript
"use client";

import Link from "next/link";
import type { Capsule } from "@/db/schema/capsules";

interface Props {
  capsule: Capsule;
}

export function CapsuleCard({ capsule }: Props) {
  const pieceCount = capsule.pieces?.length ?? 0;
  const gapCount = capsule.gapAnalysis?.length ?? 0;

  return (
    <Link
      href={`/capsules/${capsule.id}`}
      className="block bg-surface-container p-6 hover:bg-surface-container-high transition-colors"
    >
      <h3 className="font-serif text-headline-sm text-on-surface mb-2">
        {capsule.name}
      </h3>
      <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
        {capsule.description}
      </p>
      <div className="flex gap-4">
        {capsule.season && (
          <span className="label-text text-on-surface-variant">
            {capsule.season}
          </span>
        )}
        <span className="label-text text-on-surface-variant">
          {pieceCount} pieces
        </span>
        {gapCount > 0 && (
          <span className="label-text text-primary">
            {gapCount} gaps
          </span>
        )}
      </div>
      <p className="text-body-md text-on-surface-variant mt-3">
        {new Date(capsule.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}
```

- [ ] **Step 4: Create capsule detail server page**

`src/app/(auth)/capsules/[id]/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CapsuleDetailClient } from "./client";

export const metadata = { title: "Capsule Detail" };

export default async function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const { id } = await params;

  const capsule = await db.query.capsules.findFirst({
    where: and(eq(capsulesTable.id, id), eq(capsulesTable.userId, dbUserId)),
  });

  if (!capsule) redirect("/capsules");

  // Fetch linked outfits with their slots
  const linkedOutfits = await db
    .select({
      outfitId: capsuleOutfitsTable.outfitId,
      outfitName: outfitsTable.name,
      position: capsuleOutfitsTable.position,
    })
    .from(capsuleOutfitsTable)
    .innerJoin(outfitsTable, eq(capsuleOutfitsTable.outfitId, outfitsTable.id))
    .where(eq(capsuleOutfitsTable.capsuleId, id))
    .orderBy(capsuleOutfitsTable.position);

  // Fetch closet items for the pieces
  const pieceItems = capsule.pieces?.length
    ? await db
        .select()
        .from(closetItemsTable)
        .where(eq(closetItemsTable.userId, dbUserId))
    : [];

  const pieces = pieceItems.filter((item) =>
    capsule.pieces?.includes(item.id),
  );

  return (
    <CapsuleDetailClient
      capsule={capsule}
      pieces={pieces}
      outfits={linkedOutfits}
    />
  );
}
```

- [ ] **Step 5: Create capsule detail client component**

`src/app/(auth)/capsules/[id]/client.tsx`:
```typescript
"use client";

import Link from "next/link";
import type { Capsule } from "@/db/schema/capsules";
import type { ClosetItem } from "@/db/schema/closet-items";
import { CapsulePieces } from "@/components/capsules/capsule-pieces";
import { GapAnalysis } from "@/components/capsules/gap-analysis";

interface OutfitLink {
  outfitId: string;
  outfitName: string;
  position: number;
}

interface Props {
  capsule: Capsule;
  pieces: ClosetItem[];
  outfits: OutfitLink[];
}

export function CapsuleDetailClient({ capsule, pieces, outfits }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/capsules"
        className="text-label-lg uppercase tracking-widest text-on-surface-variant hover:text-on-surface mb-4 inline-block"
      >
        Back to Capsules
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-display-sm text-on-surface mb-2">
          {capsule.name}
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          {capsule.description}
        </p>
        <div className="flex gap-4 mt-3">
          {capsule.season && (
            <span className="label-text text-on-surface-variant">
              {capsule.season}
            </span>
          )}
          {capsule.theme && (
            <span className="label-text text-on-surface-variant">
              {capsule.theme}
            </span>
          )}
        </div>
      </div>

      {/* Capsule Pieces */}
      <section className="mb-12">
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Your Pieces
        </h2>
        <CapsulePieces pieces={pieces} />
      </section>

      {/* Outfit Combinations */}
      <section className="mb-12">
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Outfit Combinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outfits.map((outfit) => (
            <Link
              key={outfit.outfitId}
              href={`/outfits/${outfit.outfitId}`}
              className="bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
            >
              <p className="font-serif text-title-lg text-on-surface">
                {outfit.outfitName}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Gap Analysis */}
      {capsule.gapAnalysis && capsule.gapAnalysis.length > 0 && (
        <section>
          <h2 className="font-serif text-headline-md text-on-surface mb-4">
            Wardrobe Gaps
          </h2>
          <GapAnalysis gaps={capsule.gapAnalysis} />
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create CapsulePieces component**

`src/components/capsules/capsule-pieces.tsx`:
```typescript
"use client";

import Image from "next/image";
import type { ClosetItem } from "@/db/schema/closet-items";

interface Props {
  pieces: ClosetItem[];
}

export function CapsulePieces({ pieces }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {pieces.map((piece) => (
        <div key={piece.id} className="bg-surface-container overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={piece.imageUrl}
              alt={piece.category ?? "Clothing item"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          </div>
          <div className="p-3">
            <p className="label-text text-on-surface-variant">
              {piece.category}
            </p>
            {piece.subCategory && (
              <p className="text-body-md text-on-surface">
                {piece.subCategory}
              </p>
            )}
            {piece.colors && piece.colors.length > 0 && (
              <div className="flex gap-1 mt-1">
                {piece.colors.map((color, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 inline-block ghost-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create GapAnalysis component**

`src/components/capsules/gap-analysis.tsx`:
```typescript
"use client";

import Link from "next/link";

interface Gap {
  category: string;
  description: string;
  searchQuery: string;
}

interface Props {
  gaps: Gap[];
}

export function GapAnalysis({ gaps }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {gaps.map((gap, index) => (
        <div key={index} className="bg-surface-container p-6">
          <p className="label-text text-primary mb-2">{gap.category}</p>
          <p className="text-body-md text-on-surface mb-4">
            {gap.description}
          </p>
          <Link
            href={`/catalog?q=${encodeURIComponent(gap.searchQuery)}`}
            className="editorial-gradient inline-block px-4 py-2 text-white text-label-lg uppercase tracking-widest"
          >
            Shop to Fill Gap
          </Link>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Add Capsules nav link**

In `src/components/layout/nav.tsx`, add a "Capsules" link to the navigation items array alongside existing links (Closet, Outfits, Trends, Catalog):

```typescript
{ href: "/capsules", label: "Capsules" },
```

- [ ] **Step 9: Verify build**

Run: `pnpm build`
Expected: No errors.

**Commit:** `feat: add capsule wardrobe list and detail pages with gap analysis`
