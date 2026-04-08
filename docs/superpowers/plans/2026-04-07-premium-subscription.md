# Premium Subscription — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium subscription tier with Stripe integration, feature gates (free: 5 generations/month, premium: unlimited), usage tracking, subscription management, and upgrade prompts.

**Architecture:** Stripe handles payment processing via Checkout Sessions and Customer Portal. A webhook endpoint processes subscription events (created, updated, deleted) and syncs status to the users table. Usage tracking records generation counts per user per month in a new `usage_tracking` table. Feature gates check subscription status and usage limits before allowing gated actions. The subscription management page uses Stripe's hosted Customer Portal for billing details.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Stripe, Clerk Auth, Tailwind CSS 4, Vitest

---

## File Structure

```
src/
├── db/
│   ├── schema/
│   │   └── usage.ts                                # NEW: usage_tracking table
│   └── index.ts                                    # MODIFY: Register usage table
├── lib/
│   └── billing/
│       ├── stripe.ts                               # NEW: Stripe client + helpers
│       └── gates.ts                                # NEW: Feature gate checks
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts                        # NEW: Stripe webhook handler
│   └── (auth)/
│       └── settings/
│           └── subscription/
│               ├── page.tsx                        # NEW: Subscription page (server)
│               └── client.tsx                      # NEW: Subscription page (client)
├── components/
│   └── billing/
│       ├── upgrade-prompt.tsx                      # NEW: Upgrade modal
│       └── premium-badge.tsx                       # NEW: Premium feature badge
tests/
├── db/
│   └── usage-schema.test.ts                        # NEW
├── lib/
│   └── billing/
│       ├── stripe.test.ts                          # NEW
│       └── gates.test.ts                           # NEW
├── api/
│   └── webhooks/
│       └── stripe.test.ts                          # NEW
```

---

## Task 1: Stripe Integration

**Files:**
- Create: `src/lib/billing/stripe.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`
- Modify: `src/db/schema/users.ts`
- Modify: `src/middleware.ts`
- Test: `tests/lib/billing/stripe.test.ts`
- Test: `tests/api/webhooks/stripe.test.ts`

- [ ] **Step 1: Install packages**

Run:
```bash
pnpm add stripe @stripe/stripe-js
```

- [ ] **Step 2: Write failing tests**

`tests/lib/billing/stripe.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCheckoutCreate = vi.fn().mockResolvedValue({
  id: "cs_test_123",
  url: "https://checkout.stripe.com/cs_test_123",
});
const mockPortalCreate = vi.fn().mockResolvedValue({
  url: "https://billing.stripe.com/session/bps_test_123",
});
const mockCustomerCreate = vi.fn().mockResolvedValue({
  id: "cus_test_123",
});

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: { create: mockCheckoutCreate },
      },
      billingPortal: {
        sessions: { create: mockPortalCreate },
      },
      customers: {
        create: mockCustomerCreate,
      },
    })),
  };
});
vi.mock("@/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: "db-user-uuid",
          stripeCustomerId: null,
          email: "test@example.com",
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", stripeCustomerId: "stripe_customer_id" },
}));

import {
  createCheckoutSession,
  createCustomerPortalSession,
  getOrCreateCustomer,
} from "@/lib/billing/stripe";

describe("stripe helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_ID = "price_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("createCheckoutSession returns checkout URL", async () => {
    const result = await createCheckoutSession("db-user-uuid", "cus_test_123");
    expect(mockCheckoutCreate).toHaveBeenCalledOnce();
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("createCustomerPortalSession returns portal URL", async () => {
    const result = await createCustomerPortalSession("cus_test_123");
    expect(mockPortalCreate).toHaveBeenCalledOnce();
    expect(result.url).toContain("billing.stripe.com");
  });

  it("getOrCreateCustomer creates new customer when none exists", async () => {
    const customerId = await getOrCreateCustomer("db-user-uuid");
    expect(mockCustomerCreate).toHaveBeenCalledOnce();
    expect(customerId).toBe("cus_test_123");
  });
});
```

`tests/api/webhooks/stripe.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";
import { NextRequest } from "next/server";

const mockConstructEvent = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    })),
  };
});
vi.mock("@/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { stripeCustomerId: "stripe_customer_id" },
}));

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  it("processes customer.subscription.created event", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_test_123",
          status: "active",
        },
      },
    });

    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "stripe-signature": "test_sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid signature", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "stripe-signature": "invalid_sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/billing/stripe.test.ts tests/api/webhooks/stripe.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 4: Add subscription columns to users table**

In `src/db/schema/users.ts`, add two new columns to the `usersTable`:

```typescript
subscriptionStatus: text("subscription_status").notNull().default("free"),
stripeCustomerId: text("stripe_customer_id"),
```

These go after the existing `onboardingState` column and before `createdAt`.

- [ ] **Step 5: Push schema changes**

Run: `pnpm db:push`

- [ ] **Step 6: Create Stripe client helpers**

`src/lib/billing/stripe.ts`:
```typescript
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export { stripe };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  await db
    .update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(eq(usersTable.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  customerId: string,
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/settings/subscription?success=true`,
    cancel_url: `${APP_URL}/settings/subscription?canceled=true`,
    metadata: { userId },
  });

  return { id: session.id, url: session.url };
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings/subscription`,
  });

  return { url: session.url };
}

export async function syncSubscriptionStatus(
  customerId: string,
  status: string,
) {
  const subscriptionStatus =
    status === "active" || status === "trialing" ? "premium" : "free";

  await db
    .update(usersTable)
    .set({ subscriptionStatus })
    .where(eq(usersTable.stripeCustomerId, customerId));
}
```

- [ ] **Step 7: Create Stripe webhook handler**

`src/app/api/webhooks/stripe/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { syncSubscriptionStatus } from "@/lib/billing/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionStatus(
        subscription.customer as string,
        subscription.status,
      );
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionStatus(
        subscription.customer as string,
        "canceled",
      );
      break;
    }
    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 8: Add webhook to public routes**

In `src/middleware.ts`, the `/api/webhooks/(.*)` pattern already covers Stripe webhooks. No changes needed.

- [ ] **Step 9: Add env vars to .env.local.example**

Append:
```
STRIPE_SECRET_KEY                     # Stripe secret key
STRIPE_WEBHOOK_SECRET                 # Stripe webhook signing secret
STRIPE_PRICE_ID                       # Stripe price ID for premium plan
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # Stripe publishable key (client-side)
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/billing/stripe.test.ts tests/api/webhooks/stripe.test.ts`
Expected: PASS — all tests

**Commit:** `feat: add Stripe integration with checkout, webhook handler, and subscription sync`

---

## Task 2: Feature Gates

**Files:**
- Create: `src/db/schema/usage.ts`
- Modify: `src/db/index.ts`
- Create: `src/lib/billing/gates.ts`
- Modify: `src/app/api/outfits/generate/route.ts`
- Test: `tests/db/usage-schema.test.ts`
- Test: `tests/lib/billing/gates.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/db/usage-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { usageTrackingTable } from "@/db/schema/usage";

describe("usage_tracking schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(usageTrackingTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("action");
    expect(columns).toContain("month");
    expect(columns).toContain("count");
  });
});
```

`tests/lib/billing/gates.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindFirst = vi.fn();
const mockUsageFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: mockUserFindFirst },
      usageTracking: { findFirst: mockUsageFindFirst },
    },
    insert: mockInsert,
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id" },
}));
vi.mock("@/db/schema/usage", () => ({
  usageTrackingTable: {
    userId: "user_id",
    action: "action",
    month: "month",
    count: "count",
  },
}));

import { isPremium, canGenerate, recordUsage } from "@/lib/billing/gates";

describe("feature gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isPremium returns true for premium user", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "premium" });
    expect(await isPremium("user-1")).toBe(true);
  });

  it("isPremium returns false for free user", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    expect(await isPremium("user-1")).toBe(false);
  });

  it("canGenerate returns true for premium user regardless of usage", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "premium" });
    expect(await canGenerate("user-1")).toBe(true);
  });

  it("canGenerate returns true for free user under limit", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce({ count: 3 });
    expect(await canGenerate("user-1")).toBe(true);
  });

  it("canGenerate returns false for free user at limit", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce({ count: 5 });
    expect(await canGenerate("user-1")).toBe(false);
  });

  it("canGenerate returns true for free user with no usage record", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce(null);
    expect(await canGenerate("user-1")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/db/usage-schema.test.ts tests/lib/billing/gates.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create usage tracking schema**

`src/db/schema/usage.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const usageTrackingTable = pgTable(
  "usage_tracking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    month: text("month").notNull(), // Format: "2026-04"
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("usage_unique").on(table.userId, table.action, table.month),
  ],
);

export type UsageTracking = typeof usageTrackingTable.$inferSelect;
export type NewUsageTracking = typeof usageTrackingTable.$inferInsert;
```

- [ ] **Step 4: Register in db/index.ts**

Add to `src/db/index.ts`:
```typescript
import { usageTrackingTable } from "./schema/usage";
```

Add to schema object:
```typescript
usageTracking: usageTrackingTable,
```

- [ ] **Step 5: Push schema**

Run: `pnpm db:push`

- [ ] **Step 6: Create feature gates**

`src/lib/billing/gates.ts`:
```typescript
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { usageTrackingTable } from "@/db/schema/usage";

const FREE_GENERATION_LIMIT = 5;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function isPremium(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });
  return user?.subscriptionStatus === "premium";
}

export async function canGenerate(userId: string): Promise<boolean> {
  const premium = await isPremium(userId);
  if (premium) return true;

  const month = getCurrentMonth();
  const usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(usageTrackingTable.userId, userId),
      eq(usageTrackingTable.action, "outfit_generation"),
      eq(usageTrackingTable.month, month),
    ),
  });

  const currentCount = usage?.count ?? 0;
  return currentCount < FREE_GENERATION_LIMIT;
}

export async function getUsage(userId: string): Promise<{
  generationsUsed: number;
  generationsLimit: number;
  isPremium: boolean;
}> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });

  const premium = user?.subscriptionStatus === "premium";
  const month = getCurrentMonth();

  const usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(usageTrackingTable.userId, userId),
      eq(usageTrackingTable.action, "outfit_generation"),
      eq(usageTrackingTable.month, month),
    ),
  });

  return {
    generationsUsed: usage?.count ?? 0,
    generationsLimit: premium ? Infinity : FREE_GENERATION_LIMIT,
    isPremium: premium,
  };
}

export async function recordUsage(userId: string, action: string) {
  const month = getCurrentMonth();

  await db
    .insert(usageTrackingTable)
    .values({ userId, action, month, count: 1 })
    .onConflictDoUpdate({
      target: [
        usageTrackingTable.userId,
        usageTrackingTable.action,
        usageTrackingTable.month,
      ],
      set: {
        count: sql`${usageTrackingTable.count} + 1`,
      },
    });
}
```

- [ ] **Step 7: Wire generation limit into outfit generation API**

In `src/app/api/outfits/generate/route.ts`, add a gate check before starting generation:

```typescript
import { canGenerate, recordUsage } from "@/lib/billing/gates";

// After ensureUser, before creating the job:
const allowed = await canGenerate(dbUserId);
if (!allowed) {
  return NextResponse.json(
    { error: "Monthly generation limit reached. Upgrade to Premium for unlimited generations." },
    { status: 403 },
  );
}

// After successful generation (inside the async block, after outfit is saved):
await recordUsage(dbUserId, "outfit_generation");
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm vitest run tests/db/usage-schema.test.ts tests/lib/billing/gates.test.ts`
Expected: PASS — all tests

**Commit:** `feat: add feature gates with usage tracking and generation limits for free tier`

---

## Task 3: Subscription Management Page

**Files:**
- Create: `src/app/(auth)/settings/subscription/page.tsx`
- Create: `src/app/(auth)/settings/subscription/client.tsx`

- [ ] **Step 1: Create subscription server page**

`src/app/(auth)/settings/subscription/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getUsage } from "@/lib/billing/gates";
import { SubscriptionClient } from "./client";

export const metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, dbUserId),
  });
  if (!user) redirect("/sign-in");

  const usage = await getUsage(dbUserId);

  return (
    <SubscriptionClient
      subscriptionStatus={user.subscriptionStatus}
      stripeCustomerId={user.stripeCustomerId}
      usage={usage}
    />
  );
}
```

- [ ] **Step 2: Create subscription client component**

`src/app/(auth)/settings/subscription/client.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Props {
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  usage: {
    generationsUsed: number;
    generationsLimit: number;
    isPremium: boolean;
  };
}

export function SubscriptionClient({
  subscriptionStatus,
  stripeCustomerId,
  usage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const isPremium = subscriptionStatus === "premium";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-display-sm text-on-surface mb-8">
        Subscription
      </h1>

      {/* Current Plan */}
      <section className="bg-surface-container p-6 mb-6">
        <p className="label-text text-on-surface-variant mb-2">Current Plan</p>
        <p className="font-serif text-headline-md text-on-surface">
          {isPremium ? "Premium" : "Free"}
        </p>
      </section>

      {/* Usage */}
      <section className="bg-surface-container p-6 mb-6">
        <p className="label-text text-on-surface-variant mb-2">
          Monthly Usage
        </p>
        <p className="font-serif text-headline-sm text-on-surface">
          {usage.generationsUsed}{" "}
          {isPremium ? "" : `/ ${usage.generationsLimit}`} outfit generations
        </p>
        {!isPremium && (
          <div className="mt-3 bg-surface-container-high h-2 overflow-hidden">
            <div
              className="h-full editorial-gradient transition-all"
              style={{
                width: `${Math.min(100, (usage.generationsUsed / usage.generationsLimit) * 100)}%`,
              }}
            />
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="bg-surface-container p-6">
        {isPremium ? (
          <div>
            <p className="text-body-lg text-on-surface mb-4">
              Manage your billing, update payment method, or cancel your
              subscription through Stripe.
            </p>
            <button
              onClick={handleManage}
              disabled={loading}
              className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-body-lg text-on-surface mb-2">
              Upgrade to Premium for unlimited outfit generations, capsule
              wardrobes, and priority support.
            </p>
            <ul className="text-body-md text-on-surface-variant mb-4 space-y-1">
              <li>Unlimited outfit generations</li>
              <li>Capsule wardrobe generator</li>
              <li>Advanced style analytics</li>
              <li>Priority AI processing</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Loading..." : "Upgrade to Premium"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create billing API endpoints**

Create `src/app/api/billing/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getOrCreateCustomer, createCheckoutSession } from "@/lib/billing/stripe";

export async function POST(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const customerId = await getOrCreateCustomer(dbUserId);
  const session = await createCheckoutSession(dbUserId, customerId);

  return NextResponse.json({ url: session.url });
}
```

Create `src/app/api/billing/portal/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getOrCreateCustomer, createCustomerPortalSession } from "@/lib/billing/stripe";

export async function POST(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const customerId = await getOrCreateCustomer(dbUserId);
  const session = await createCustomerPortalSession(customerId);

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: No errors.

**Commit:** `feat: add subscription management page with Stripe checkout and customer portal`

---

## Task 4: Upgrade Prompts

**Files:**
- Create: `src/components/billing/upgrade-prompt.tsx`
- Create: `src/components/billing/premium-badge.tsx`
- Modify: `src/components/layout/nav.tsx`

- [ ] **Step 1: Create upgrade prompt modal**

`src/components/billing/upgrade-prompt.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradePrompt({ isOpen, onClose, reason }: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface z-10 max-w-md w-full mx-4 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 className="font-serif text-headline-md text-on-surface mb-2">
          Upgrade to Premium
        </h2>
        {reason && (
          <p className="text-body-lg text-on-surface-variant mb-4">
            {reason}
          </p>
        )}

        <ul className="text-body-md text-on-surface space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Unlimited outfit generations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            AI capsule wardrobe generator
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Advanced style analytics
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Priority AI processing
          </li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="editorial-gradient flex-1 px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Loading..." : "Upgrade Now"}
          </button>
          <button
            onClick={onClose}
            className="bg-surface-container-high flex-1 px-6 py-3 text-on-surface text-label-lg uppercase tracking-widest"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create premium badge component**

`src/components/billing/premium-badge.tsx`:
```typescript
"use client";

interface Props {
  label?: string;
}

export function PremiumBadge({ label = "Premium" }: Props) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-label-md uppercase tracking-widest">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
      </svg>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Add upgrade badge to nav for free users**

In `src/components/layout/nav.tsx`, conditionally show an upgrade link or premium badge based on user subscription status. The subscription status should be fetched server-side and passed as a prop:

```typescript
// If the nav already receives user data, extend it with subscriptionStatus
// Otherwise, add a small indicator near the user/profile area:

{subscriptionStatus !== "premium" && (
  <Link
    href="/settings/subscription"
    className="editorial-gradient px-3 py-1 text-white text-label-md uppercase tracking-widest"
  >
    Upgrade
  </Link>
)}
```

- [ ] **Step 4: Wire upgrade prompt into generation flow**

In the outfit generation client component, when the API returns a 403 (limit reached), show the `UpgradePrompt`:

```typescript
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

// State:
const [showUpgrade, setShowUpgrade] = useState(false);

// In the generation handler:
const res = await fetch("/api/outfits/generate", { ... });
if (res.status === 403) {
  setShowUpgrade(true);
  return;
}

// Render:
<UpgradePrompt
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  reason="You've reached your monthly limit of 5 outfit generations."
/>
```

- [ ] **Step 5: Add PremiumBadge to premium-only features**

Add `<PremiumBadge />` next to features that are premium-only in the UI:
- Capsule wardrobe generator button (if capsule generation is gated)
- Advanced analytics sections
- Any future premium features

```typescript
import { PremiumBadge } from "@/components/billing/premium-badge";

// Example usage next to a feature label:
<div className="flex items-center gap-2">
  <span>Capsule Wardrobe</span>
  <PremiumBadge />
</div>
```

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: No errors.

- [ ] **Step 7: Verify full billing test suite**

Run: `pnpm vitest run tests/db/usage-schema.test.ts tests/lib/billing/ tests/api/webhooks/stripe.test.ts`
Expected: PASS — all billing tests green

**Commit:** `feat: add upgrade prompts, premium badges, and generation limit UI integration`
