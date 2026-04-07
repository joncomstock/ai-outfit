# Phase 2: Outfit Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered outfit generation — users generate outfits from their closet items, view slot-by-slot compositions, rate them, and save to a lookbook.

**Architecture:** LLM-based outfit composition using Claude Sonnet. The user's closet item metadata (categories, colors, style tags — not images) is sent to Claude with a structured prompt. Claude returns a JSON outfit composition referencing item IDs. Outfits are stored as a parent record + child slot records (top, bottom, shoes, optional outerwear/accessory). Two generation modes: "For You" (personalized from full closet) and "Style This Item" (build around a specific piece). Background job with SSE progress, editorial loading state, then full reveal.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Anthropic Claude API, Server-Sent Events, Tailwind CSS 4

**Design Reference:** Stitch project `5273890100334486731`, screen "Outfit Detail" — editorial layout with outfit name as large serif headline, slot-based item display with images, star rating, shopping sidebar, and "More from the archive" section.

---

## File Structure

```
src/
├── db/schema/
│   └── outfits.ts                          # NEW: outfits + outfit_slots tables
├── lib/ai/
│   └── generate-outfit.ts                  # NEW: Claude outfit generation logic
├── app/
│   ├── (auth)/
│   │   └── outfits/
│   │       ├── page.tsx                    # NEW: Outfits list / lookbook (server)
│   │       ├── client.tsx                  # NEW: Outfits list client component
│   │       └── [id]/
│   │           ├── page.tsx                # NEW: Outfit detail (server)
│   │           └── client.tsx              # NEW: Outfit detail client component
│   └── api/
│       └── outfits/
│           ├── route.ts                    # NEW: GET list
│           ├── generate/
│           │   └── route.ts                # NEW: POST trigger generation
│           └── [id]/
│               ├── route.ts                # NEW: GET detail, DELETE
│               └── rate/
│                   └── route.ts            # NEW: PATCH rating
├── components/outfits/
│   ├── outfit-card.tsx                     # NEW: Card for lookbook grid
│   ├── outfit-slot.tsx                     # NEW: Single slot display (image + label)
│   ├── outfit-rating.tsx                   # NEW: Star rating component
│   ├── generation-modal.tsx                # NEW: Mode selection modal
│   └── generating-state.tsx                # NEW: Editorial loading animation
├── db/
│   └── index.ts                            # MODIFY: Add outfits + slots to schema
```

---

## Task 1: Outfits Database Schema

**Files:**
- Create: `src/db/schema/outfits.ts`
- Modify: `src/db/index.ts`
- Test: `tests/db/outfits-schema.test.ts`

- [ ] **Step 1: Write failing test**

`tests/db/outfits-schema.test.ts`:
```typescript
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { getTableName } from "drizzle-orm";

describe("Outfits schema", () => {
  it("outfits table has correct name", () => {
    expect(getTableName(outfitsTable)).toBe("outfits");
  });

  it("outfit_slots table has correct name", () => {
    expect(getTableName(outfitSlotsTable)).toBe("outfit_slots");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/db/outfits-schema.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create outfits schema**

`src/db/schema/outfits.ts`:
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
import { usersTable } from "./users";
import { closetItemsTable } from "./closet-items";

export const generationModeEnum = pgEnum("generation_mode", [
  "for_you",
  "trend_based",
  "style_this",
]);

export const slotTypeEnum = pgEnum("slot_type", [
  "top",
  "bottom",
  "shoes",
  "outerwear",
  "accessory",
]);

export const outfitsTable = pgTable("outfits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  generationMode: generationModeEnum("generation_mode").notNull(),
  sourceItemId: uuid("source_item_id").references(() => closetItemsTable.id, {
    onDelete: "set null",
  }),
  rating: integer("rating"),
  feedback: text("feedback"),
  shareToken: text("share_token").unique(),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const outfitSlotsTable = pgTable("outfit_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  outfitId: uuid("outfit_id")
    .notNull()
    .references(() => outfitsTable.id, { onDelete: "cascade" }),
  slotType: slotTypeEnum("slot_type").notNull(),
  closetItemId: uuid("closet_item_id").references(() => closetItemsTable.id, {
    onDelete: "set null",
  }),
  position: integer("position").notNull().default(0),
});

export type Outfit = typeof outfitsTable.$inferSelect;
export type NewOutfit = typeof outfitsTable.$inferInsert;
export type OutfitSlot = typeof outfitSlotsTable.$inferSelect;
export type NewOutfitSlot = typeof outfitSlotsTable.$inferInsert;
```

- [ ] **Step 4: Update DB client to include new tables**

Modify `src/db/index.ts`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./schema/users";
import { closetItemsTable } from "./schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "./schema/outfits";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: {
    users: usersTable,
    closetItems: closetItemsTable,
    outfits: outfitsTable,
    outfitSlots: outfitSlotsTable,
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/db/outfits-schema.test.ts`
Expected: PASS

- [ ] **Step 6: Push schema to Neon**

Run: `pnpm db:push`
Expected: New tables `outfits` and `outfit_slots` created with enums.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add outfits and outfit_slots database schema"
```

---

## Task 2: Outfit Generation AI Logic

**Files:**
- Create: `src/lib/ai/generate-outfit.ts`
- Test: `tests/lib/ai/generate-outfit.test.ts`

- [ ] **Step 1: Write failing test**

`tests/lib/ai/generate-outfit.test.ts`:
```typescript
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "The Autumn Essential",
              slots: [
                { slotType: "top", closetItemId: "item-1" },
                { slotType: "bottom", closetItemId: "item-2" },
                { slotType: "shoes", closetItemId: "item-3" },
              ],
            }),
          },
        ],
      }),
    };
  }
  return { default: MockAnthropic };
});

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "outfit-1" }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: "item-1",
            category: "tops",
            subCategory: "blazer",
            colors: ["#1A1A1A"],
            fit: "regular",
            seasonality: ["fall", "winter"],
            styleTags: ["formal", "classic"],
          },
          {
            id: "item-2",
            category: "bottoms",
            subCategory: "trousers",
            colors: ["#2B2B2B"],
            fit: "slim",
            seasonality: ["fall", "winter"],
            styleTags: ["formal", "minimal"],
          },
          {
            id: "item-3",
            category: "shoes",
            subCategory: "oxford",
            colors: ["#4A3728"],
            fit: "regular",
            seasonality: ["fall", "winter", "spring"],
            styleTags: ["formal", "classic"],
          },
        ]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: "user-1",
          stylePreferences: ["formal"],
          budgetRange: "mid",
        }),
      },
    },
  },
}));

vi.mock("@/db/schema/users", () => ({ usersTable: { id: "id" } }));
vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { userId: "user_id", status: "status" },
}));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: "outfits_mock",
  outfitSlotsTable: "outfit_slots_mock",
}));

vi.mock("@/lib/jobs/job-store", () => ({
  updateJobStatus: vi.fn(),
}));

import { generateOutfit } from "@/lib/ai/generate-outfit";
import { updateJobStatus } from "@/lib/jobs/job-store";

describe("generateOutfit", () => {
  it("generates an outfit in for_you mode and returns outfit ID", async () => {
    const result = await generateOutfit({
      userId: "user-1",
      mode: "for_you",
      jobId: "job-1",
    });

    expect(result).toBe("outfit-1");
    expect(updateJobStatus).toHaveBeenCalledWith("job-1", "analyzing");
    expect(updateJobStatus).toHaveBeenCalledWith("job-1", "ready");
  });

  it("marks job as error on failure", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    vi.mocked(new Anthropic().messages.create).mockRejectedValueOnce(
      new Error("API error")
    );

    const result = await generateOutfit({
      userId: "user-1",
      mode: "for_you",
      jobId: "job-2",
    });

    expect(result).toBeNull();
    expect(updateJobStatus).toHaveBeenCalledWith(
      "job-2",
      "error",
      expect.any(String)
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/lib/ai/generate-outfit.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement generateOutfit**

`src/lib/ai/generate-outfit.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { updateJobStatus } from "@/lib/jobs/job-store";

const anthropic = new Anthropic();

interface GenerateOptions {
  userId: string;
  mode: "for_you" | "style_this";
  sourceItemId?: string;
  jobId: string;
}

interface OutfitComposition {
  name: string;
  slots: { slotType: string; closetItemId: string }[];
}

const SYSTEM_PROMPT = `You are an expert fashion stylist AI. Compose a complete outfit from the user's wardrobe items. Return a JSON object with:

{
  "name": string (a creative editorial outfit name, 2-4 words, e.g., "The Autumn Essential", "Urban Minimalist", "Coastal Weekend"),
  "slots": [
    { "slotType": "top", "closetItemId": "<id>" },
    { "slotType": "bottom", "closetItemId": "<id>" },
    { "slotType": "shoes", "closetItemId": "<id>" },
    { "slotType": "outerwear", "closetItemId": "<id>" },
    { "slotType": "accessory", "closetItemId": "<id>" }
  ]
}

Rules:
- MUST include exactly one "top", one "bottom", and one "shoes" slot
- "outerwear" and "accessory" are optional — only include if it enhances the outfit
- Each closetItemId MUST be from the provided item list
- Never use the same item in multiple slots
- Consider color harmony, style coherence, seasonality, and fit compatibility
- The outfit name should be evocative and editorial

Return ONLY valid JSON, no markdown fences, no explanation.`;

function buildUserMessage(
  items: {
    id: string;
    category: string | null;
    subCategory: string | null;
    colors: string[] | null;
    fit: string | null;
    seasonality: string[] | null;
    styleTags: string[] | null;
  }[],
  mode: "for_you" | "style_this",
  sourceItemId?: string,
  preferences?: string[],
  budgetRange?: string
): string {
  const itemList = items
    .map(
      (i) =>
        `- ID: ${i.id} | ${i.category}/${i.subCategory} | colors: ${(i.colors ?? []).join(", ")} | fit: ${i.fit} | seasons: ${(i.seasonality ?? []).join(", ")} | tags: ${(i.styleTags ?? []).join(", ")}`
    )
    .join("\n");

  let prompt = `## Wardrobe Items\n\n${itemList}\n\n`;

  if (preferences && preferences.length > 0) {
    prompt += `## Style Preferences: ${preferences.join(", ")}\n`;
  }
  if (budgetRange) {
    prompt += `## Budget Range: ${budgetRange}\n`;
  }

  if (mode === "style_this" && sourceItemId) {
    prompt += `\n## Task: Build a complete outfit around item ${sourceItemId}. This item MUST appear in the outfit.\n`;
  } else {
    prompt += `\n## Task: Create the best possible outfit from these items.\n`;
  }

  return prompt;
}

export async function generateOutfit(
  options: GenerateOptions
): Promise<string | null> {
  const { userId, mode, sourceItemId, jobId } = options;

  try {
    updateJobStatus(jobId, "analyzing");

    // Fetch user preferences
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, userId),
    });

    // Fetch all ready closet items
    const items = await db
      .select()
      .from(closetItemsTable)
      .where(
        and(
          eq(closetItemsTable.userId, userId),
          eq(closetItemsTable.status, "ready")
        )
      );

    if (items.length < 3) {
      updateJobStatus(
        jobId,
        "error",
        "You need at least 3 analyzed items (top, bottom, shoes) to generate an outfit."
      );
      return null;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(
            items,
            mode,
            sourceItemId,
            user?.stylePreferences ?? [],
            user?.budgetRange ?? undefined
          ),
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const composition: OutfitComposition = JSON.parse(text);

    // Validate all referenced items belong to the user
    const validItemIds = new Set(items.map((i) => i.id));
    const validSlots = composition.slots.filter((s) =>
      validItemIds.has(s.closetItemId)
    );

    if (validSlots.length < 3) {
      updateJobStatus(jobId, "error", "AI generated an invalid outfit composition. Please try again.");
      return null;
    }

    // Save outfit
    const [outfit] = await db
      .insert(outfitsTable)
      .values({
        userId,
        name: composition.name,
        generationMode: mode,
        sourceItemId: sourceItemId ?? null,
        aiRawResponse: composition,
      })
      .returning();

    // Save slots
    await db.insert(outfitSlotsTable).values(
      validSlots.map((s, i) => ({
        outfitId: outfit.id,
        slotType: s.slotType as "top" | "bottom" | "shoes" | "outerwear" | "accessory",
        closetItemId: s.closetItemId,
        position: i,
      }))
    );

    // Update onboarding state
    if (user && user.onboardingState === "first_processed") {
      await db
        .update(usersTable)
        .set({ onboardingState: "first_outfit" })
        .where(eq(usersTable.id, userId));
    }

    updateJobStatus(jobId, "ready");
    return outfit.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    updateJobStatus(jobId, "error", message);
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/lib/ai/generate-outfit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Claude-powered outfit generation logic"
```

---

## Task 3: Outfit API Endpoints

**Files:**
- Create: `src/app/api/outfits/route.ts`, `src/app/api/outfits/generate/route.ts`, `src/app/api/outfits/[id]/route.ts`, `src/app/api/outfits/[id]/rate/route.ts`
- Test: `tests/api/outfits/generate.test.ts`, `tests/api/outfits/outfits.test.ts`

- [ ] **Step 1: Write failing test for generation endpoint**

`tests/api/outfits/generate.test.ts`:
```typescript
import { POST } from "@/app/api/outfits/generate/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));

vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));

vi.mock("@/lib/jobs/job-store", () => ({
  createJob: vi.fn().mockReturnValue("job-uuid-1"),
}));

vi.mock("@/lib/ai/generate-outfit", () => ({
  generateOutfit: vi.fn().mockResolvedValue("outfit-uuid-1"),
}));

describe("POST /api/outfits/generate", () => {
  it("triggers outfit generation and returns job ID", async () => {
    const req = new NextRequest("http://localhost/api/outfits/generate", {
      method: "POST",
      body: JSON.stringify({ mode: "for_you" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toHaveProperty("jobId", "job-uuid-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/api/outfits/generate.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement generation endpoint**

`src/app/api/outfits/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { createJob } from "@/lib/jobs/job-store";
import { generateOutfit } from "@/lib/ai/generate-outfit";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const mode = body.mode as "for_you" | "style_this";
  const sourceItemId = body.sourceItemId as string | undefined;

  if (!mode || !["for_you", "style_this"].includes(mode)) {
    return NextResponse.json(
      { error: "Invalid mode. Use 'for_you' or 'style_this'" },
      { status: 400 }
    );
  }

  if (mode === "style_this" && !sourceItemId) {
    return NextResponse.json(
      { error: "sourceItemId required for style_this mode" },
      { status: 400 }
    );
  }

  const jobId = createJob("outfit-generation");

  // Fire and forget
  generateOutfit({ userId: dbUserId, mode, sourceItemId, jobId }).catch(
    console.error
  );

  return NextResponse.json({ jobId }, { status: 202 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/api/outfits/generate.test.ts`
Expected: PASS

- [ ] **Step 5: Write test for list and detail endpoints**

`tests/api/outfits/outfits.test.ts`:
```typescript
import { GET } from "@/app/api/outfits/route";
import { GET as GET_DETAIL, DELETE } from "@/app/api/outfits/[id]/route";
import { PATCH } from "@/app/api/outfits/[id]/rate/route";
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
            { id: "outfit-1", name: "Autumn Essential", generationMode: "for_you" },
          ]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "outfit-1", rating: 4 }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    query: {
      outfits: {
        findFirst: vi.fn().mockResolvedValue({
          id: "outfit-1",
          name: "Autumn Essential",
          userId: "db-user-uuid",
        }),
      },
      outfitSlots: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", userId: "user_id" },
  outfitSlotsTable: { outfitId: "outfit_id" },
}));

describe("GET /api/outfits", () => {
  it("returns user outfits", async () => {
    const req = new NextRequest("http://localhost/api/outfits");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe("PATCH /api/outfits/[id]/rate", () => {
  it("updates rating", async () => {
    const req = new NextRequest("http://localhost/api/outfits/outfit-1/rate", {
      method: "PATCH",
      body: JSON.stringify({ rating: 4 }),
      headers: { "Content-Type": "application/json" },
    });
    const params = Promise.resolve({ id: "outfit-1" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 6: Implement list endpoint**

`src/app/api/outfits/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const outfits = await db
    .select()
    .from(outfitsTable)
    .where(eq(outfitsTable.userId, dbUserId))
    .orderBy(desc(outfitsTable.createdAt));

  return NextResponse.json(outfits);
}
```

- [ ] **Step 7: Implement detail and delete endpoint**

`src/app/api/outfits/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  const outfit = await db.query.outfits.findFirst({
    where: and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)),
  });

  if (!outfit) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }

  // Fetch slots with their closet items
  const slots = await db
    .select({
      id: outfitSlotsTable.id,
      slotType: outfitSlotsTable.slotType,
      position: outfitSlotsTable.position,
      closetItemId: outfitSlotsTable.closetItemId,
      itemImageUrl: closetItemsTable.imageUrl,
      itemCategory: closetItemsTable.category,
      itemSubCategory: closetItemsTable.subCategory,
      itemColors: closetItemsTable.colors,
    })
    .from(outfitSlotsTable)
    .leftJoin(
      closetItemsTable,
      eq(outfitSlotsTable.closetItemId, closetItemsTable.id)
    )
    .where(eq(outfitSlotsTable.outfitId, id));

  return NextResponse.json({ ...outfit, slots });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  await db
    .delete(outfitsTable)
    .where(and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)));

  return NextResponse.json({ deleted: true });
}
```

- [ ] **Step 8: Implement rate endpoint**

`src/app/api/outfits/[id]/rate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await req.json();

  const rating = body.rating as number | undefined;
  const feedback = body.feedback as string | undefined;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) updates.rating = rating;
  if (feedback !== undefined) updates.feedback = feedback;

  const [updated] = await db
    .update(outfitsTable)
    .set(updates)
    .where(and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
```

- [ ] **Step 9: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add outfit API endpoints (list, detail, generate, rate, delete)"
```

---

## Task 4: Outfit UI Components

**Files:**
- Create: `src/components/outfits/outfit-card.tsx`, `src/components/outfits/outfit-slot.tsx`, `src/components/outfits/outfit-rating.tsx`, `src/components/outfits/generation-modal.tsx`, `src/components/outfits/generating-state.tsx`

- [ ] **Step 1: Create OutfitSlot component**

`src/components/outfits/outfit-slot.tsx`:
```tsx
import Image from "next/image";

interface OutfitSlotProps {
  slotType: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

const slotLabels: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessory",
};

export function OutfitSlot({
  slotType,
  imageUrl,
  category,
  subCategory,
}: OutfitSlotProps) {
  return (
    <div className="group">
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={subCategory ?? category ?? slotType}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="label-text text-on-surface-variant">
              {slotLabels[slotType] ?? slotType}
            </span>
          </div>
        )}
      </div>
      <p className="font-serif text-body-lg text-on-surface capitalize">
        {subCategory ?? category ?? slotLabels[slotType]}
      </p>
      <p className="label-text text-on-surface-variant text-label-md mt-0.5">
        {slotLabels[slotType]?.toUpperCase()}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create OutfitRating component**

`src/components/outfits/outfit-rating.tsx`:
```tsx
"use client";

import { useState } from "react";

interface OutfitRatingProps {
  outfitId: string;
  initialRating?: number | null;
  onRate?: (rating: number) => void;
}

export function OutfitRating({
  outfitId,
  initialRating,
  onRate,
}: OutfitRatingProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleRate = async (value: number) => {
    setSaving(true);
    setRating(value);
    try {
      await fetch(`/api/outfits/${outfitId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      onRate?.(value);
    } catch {
      setRating(initialRating ?? 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          disabled={saving}
          className="p-0.5 transition-colors"
          aria-label={`Rate ${star} stars`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={star <= (hovered || rating) ? "#974232" : "none"}
            stroke="#974232"
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create OutfitCard component**

`src/components/outfits/outfit-card.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import type { Outfit } from "@/db/schema/outfits";

interface OutfitCardProps {
  outfit: Outfit & {
    slots?: {
      slotType: string;
      itemImageUrl: string | null;
      itemSubCategory: string | null;
    }[];
  };
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const topSlot = outfit.slots?.find((s) => s.slotType === "top");
  const previewImage = topSlot?.itemImageUrl;

  return (
    <Link
      href={`/outfits/${outfit.id}`}
      className="group bg-surface-container-lowest transition-shadow duration-200 hover:shadow-ambient block"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low">
        {previewImage ? (
          <Image
            src={previewImage}
            alt={outfit.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="label-text text-on-surface-variant">
              {outfit.name}
            </span>
          </div>
        )}
        {outfit.rating && (
          <div className="absolute top-3 right-3 flex gap-0.5">
            {Array.from({ length: outfit.rating }).map((_, i) => (
              <svg
                key={i}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#974232"
                stroke="none"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-serif text-title-md text-on-surface">
          {outfit.name}
        </p>
        <p className="label-text text-on-surface-variant text-label-md mt-1">
          {outfit.slots?.length ?? 0} PIECES
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Create GenerationModal component**

`src/components/outfits/generation-modal.tsx`:
```tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ClosetItem } from "@/db/schema/closet-items";

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems?: ClosetItem[];
}

export function GenerationModal({
  isOpen,
  onClose,
  closetItems = [],
}: GenerationModalProps) {
  const [mode, setMode] = useState<"for_you" | "style_this">("for_you");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sourceItemId: mode === "style_this" ? selectedItem : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const { jobId } = await res.json();
      toast("Generating your outfit...", "info");
      onClose();

      // Poll for completion via SSE — redirect when done
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
      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to generate outfit",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [mode, selectedItem, toast, onClose, router]);

  const readyItems = closetItems.filter((i) => i.status === "ready");
  const canGenerate = readyItems.length >= 3;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Outfit"
      className="max-w-xl"
    >
      <div className="space-y-8">
        <div>
          <p className="label-text text-on-surface-variant mb-4">
            GENERATION MODE
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("for_you")}
              className={`flex-1 p-6 text-left transition-colors ${
                mode === "for_you"
                  ? "bg-primary-fixed/30 ghost-border"
                  : "bg-surface-container-low hover:bg-surface-container"
              }`}
            >
              <p className="font-serif text-title-md text-on-surface mb-1">
                For You
              </p>
              <p className="text-body-md text-on-surface-variant">
                AI picks the best combination from your entire closet.
              </p>
            </button>
            <button
              onClick={() => setMode("style_this")}
              className={`flex-1 p-6 text-left transition-colors ${
                mode === "style_this"
                  ? "bg-primary-fixed/30 ghost-border"
                  : "bg-surface-container-low hover:bg-surface-container"
              }`}
            >
              <p className="font-serif text-title-md text-on-surface mb-1">
                Style This Item
              </p>
              <p className="text-body-md text-on-surface-variant">
                Build an outfit around a specific piece.
              </p>
            </button>
          </div>
        </div>

        {mode === "style_this" && (
          <div>
            <p className="label-text text-on-surface-variant mb-4">
              SELECT AN ITEM
            </p>
            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {readyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`aspect-[3/4] relative overflow-hidden ${
                    selectedItem === item.id
                      ? "ring-2 ring-primary"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.subCategory ?? "item"}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {!canGenerate && (
          <p className="text-body-md text-error">
            You need at least 3 analyzed items (top, bottom, shoes) to generate
            an outfit.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !canGenerate ||
              (mode === "style_this" && !selectedItem)
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

- [ ] **Step 5: Create GeneratingState component**

`src/components/outfits/generating-state.tsx`:
```tsx
export function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="w-64 h-0.5 bg-surface-container-high overflow-hidden">
        <div className="h-full editorial-gradient animate-pulse w-1/2" />
      </div>
      <div className="text-center">
        <p className="font-serif text-headline-sm text-on-surface italic mb-2">
          Composing your look...
        </p>
        <p className="text-body-md text-on-surface-variant">
          Our AI stylist is curating the perfect combination from your wardrobe.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add outfit UI components (card, slot, rating, generation modal, loading state)"
```

---

## Task 5: Outfits List Page (Lookbook)

**Files:**
- Create: `src/app/(auth)/outfits/page.tsx`, `src/app/(auth)/outfits/client.tsx`

- [ ] **Step 1: Create server component**

`src/app/(auth)/outfits/page.tsx`:
```tsx
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { OutfitsPageClient } from "./client";

export default async function OutfitsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const outfits = await db
    .select()
    .from(outfitsTable)
    .where(eq(outfitsTable.userId, userId))
    .orderBy(desc(outfitsTable.createdAt));

  // Fetch slots with item images for preview
  const outfitsWithSlots = await Promise.all(
    outfits.map(async (outfit) => {
      const slots = await db
        .select({
          slotType: outfitSlotsTable.slotType,
          itemImageUrl: closetItemsTable.imageUrl,
          itemSubCategory: closetItemsTable.subCategory,
        })
        .from(outfitSlotsTable)
        .leftJoin(
          closetItemsTable,
          eq(outfitSlotsTable.closetItemId, closetItemsTable.id)
        )
        .where(eq(outfitSlotsTable.outfitId, outfit.id));

      return { ...outfit, slots };
    })
  );

  // Also fetch closet items for the generation modal
  const closetItems = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, userId));

  return (
    <OutfitsPageClient outfits={outfitsWithSlots} closetItems={closetItems} />
  );
}
```

- [ ] **Step 2: Create client component**

`src/app/(auth)/outfits/client.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { OutfitCard } from "@/components/outfits/outfit-card";
import { GenerationModal } from "@/components/outfits/generation-modal";
import type { Outfit } from "@/db/schema/outfits";
import type { ClosetItem } from "@/db/schema/closet-items";

interface OutfitsPageClientProps {
  outfits: (Outfit & {
    slots?: {
      slotType: string;
      itemImageUrl: string | null;
      itemSubCategory: string | null;
    }[];
  })[];
  closetItems: ClosetItem[];
}

export function OutfitsPageClient({
  outfits,
  closetItems,
}: OutfitsPageClientProps) {
  const [showGenerate, setShowGenerate] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
            YOUR LOOKBOOK
          </span>
          <h1 className="font-serif text-display-sm text-on-surface">
            Curated Outfits
          </h1>
        </div>
        <Button onClick={() => setShowGenerate(true)}>
          + GENERATE OUTFIT
        </Button>
      </div>

      {outfits.length === 0 ? (
        <EmptyState
          title="No outfits yet"
          description="Generate your first AI-curated outfit from your wardrobe. Our stylist will compose the perfect look."
          actionLabel="Generate Your First Outfit"
          onAction={() => setShowGenerate(true)}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}

      <GenerationModal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        closetItems={closetItems}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify page renders**

Run: `pnpm dev`
Navigate to `/outfits`. Expected: Empty state with "Generate Your First Outfit" CTA.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add outfits lookbook page with generation modal"
```

---

## Task 6: Outfit Detail Page

**Files:**
- Create: `src/app/(auth)/outfits/[id]/page.tsx`, `src/app/(auth)/outfits/[id]/client.tsx`

- [ ] **Step 1: Create server component**

`src/app/(auth)/outfits/[id]/page.tsx`:
```tsx
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { OutfitDetailClient } from "./client";
import { notFound } from "next/navigation";

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const { id } = await params;

  const outfit = await db.query.outfits.findFirst({
    where: and(eq(outfitsTable.id, id), eq(outfitsTable.userId, userId)),
  });

  if (!outfit) notFound();

  const slots = await db
    .select({
      id: outfitSlotsTable.id,
      slotType: outfitSlotsTable.slotType,
      position: outfitSlotsTable.position,
      closetItemId: outfitSlotsTable.closetItemId,
      itemImageUrl: closetItemsTable.imageUrl,
      itemCategory: closetItemsTable.category,
      itemSubCategory: closetItemsTable.subCategory,
      itemColors: closetItemsTable.colors,
    })
    .from(outfitSlotsTable)
    .leftJoin(
      closetItemsTable,
      eq(outfitSlotsTable.closetItemId, closetItemsTable.id)
    )
    .where(eq(outfitSlotsTable.outfitId, id));

  return <OutfitDetailClient outfit={outfit} slots={slots} />;
}
```

- [ ] **Step 2: Create client component matching Stitch "Outfit Detail" design**

`src/app/(auth)/outfits/[id]/client.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OutfitSlot } from "@/components/outfits/outfit-slot";
import { OutfitRating } from "@/components/outfits/outfit-rating";
import { useToast } from "@/components/ui/toast";
import type { Outfit } from "@/db/schema/outfits";

interface SlotWithItem {
  id: string;
  slotType: string;
  position: number;
  closetItemId: string | null;
  itemImageUrl: string | null;
  itemCategory: string | null;
  itemSubCategory: string | null;
  itemColors: string[] | null;
}

interface OutfitDetailClientProps {
  outfit: Outfit;
  slots: SlotWithItem[];
}

export function OutfitDetailClient({
  outfit,
  slots,
}: OutfitDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Sort: top, bottom, shoes, outerwear, accessory
  const slotOrder = ["top", "bottom", "shoes", "outerwear", "accessory"];
  const sortedSlots = [...slots].sort(
    (a, b) => slotOrder.indexOf(a.slotType) - slotOrder.indexOf(b.slotType)
  );

  const primarySlots = sortedSlots.filter(
    (s) => s.slotType === "top" || s.slotType === "bottom"
  );
  const secondarySlots = sortedSlots.filter(
    (s) =>
      s.slotType === "shoes" ||
      s.slotType === "outerwear" ||
      s.slotType === "accessory"
  );

  const handleDelete = async () => {
    if (!confirm("Delete this outfit?")) return;
    await fetch(`/api/outfits/${outfit.id}`, { method: "DELETE" });
    toast("Outfit deleted", "info");
    router.push("/outfits");
    router.refresh();
  };

  const createdDate = new Date(outfit.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <span className="label-text text-on-surface-variant tracking-widest mb-3 block">
          OUTFIT COMPOSITION — {createdDate.toUpperCase()}
        </span>
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-display-sm text-on-surface">
            {outfit.name || "Untitled Outfit"}
          </h1>
          <div className="flex items-center gap-4">
            <OutfitRating outfitId={outfit.id} initialRating={outfit.rating} />
            <Button variant="tertiary" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Primary items — large 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {primarySlots.map((slot) => (
          <OutfitSlot
            key={slot.id}
            slotType={slot.slotType}
            imageUrl={slot.itemImageUrl}
            category={slot.itemCategory}
            subCategory={slot.itemSubCategory}
          />
        ))}
      </div>

      {/* Secondary items — smaller 3-column grid */}
      {secondarySlots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {secondarySlots.map((slot) => (
            <OutfitSlot
              key={slot.id}
              slotType={slot.slotType}
              imageUrl={slot.itemImageUrl}
              category={slot.itemCategory}
              subCategory={slot.itemSubCategory}
            />
          ))}
        </div>
      )}

      {/* Feedback section */}
      <section className="py-12 border-t border-outline-variant/10">
        <h2 className="font-serif text-headline-sm text-on-surface mb-4 italic">
          Style Notes
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          {outfit.feedback ??
            "Rate this outfit and add your thoughts to help the AI learn your preferences."}
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify page renders with a test outfit**

Run: `pnpm dev`
Generate an outfit, then navigate to its detail page. Expected: Editorial layout with outfit name as large serif headline, slot-based item display, star rating.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add outfit detail page with editorial slot layout and rating"
```

---

## Task 7: Wire Generate Button into Dashboard + Nav

**Files:**
- Modify: `src/app/(auth)/page.tsx` (add generate CTA)
- Modify: `src/components/layout/nav.tsx` (ensure Outfits link works)

- [ ] **Step 1: Update dashboard to link outfits stats and CTA**

In `src/app/(auth)/page.tsx`, update the stats row to link to `/outfits`:

Find the outfits stat `{ value: 0, label: "Outfits" }` and replace the static 0 with a real count. Add this import and query near the top of the function (after the existing `itemCountResult` query):

```typescript
import { outfitsTable } from "@/db/schema/outfits";

// Add after itemCountResult query:
const [outfitCountResult] = await db
  .select({ value: count() })
  .from(outfitsTable)
  .where(eq(outfitsTable.userId, user.id));

const outfitCount = outfitCountResult?.value ?? 0;
```

Then update the stats array to use `outfitCount` instead of `0`.

- [ ] **Step 2: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: wire outfit count into dashboard stats"
```

---

## Task 8: Final Integration Verification

- [ ] **Step 1: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: TypeScript compilation succeeds (build may fail at page generation without DATABASE_URL — that's expected)

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev` and verify:
1. `/outfits` — Empty state with "Generate Your First Outfit" CTA
2. Click generate — Modal opens with "For You" and "Style This Item" modes
3. Select "For You" and generate — Toast shows "Generating...", then redirects to `/outfits`
4. Click the generated outfit — Detail page shows with editorial layout, slot images, star rating
5. Rate the outfit — Stars persist on refresh
6. Dashboard stats show updated outfit count

- [ ] **Step 4: Push schema changes**

Run: `pnpm db:push`
Expected: Outfits and outfit_slots tables exist in Neon.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: phase 2 complete — outfit generation"
```
