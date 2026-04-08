# Social Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add social features: following system, public profile pages, activity feed from followed users, and like/save system for shared outfits.

**Architecture:** Three new tables (`follows`, `activities`, `likes`) extend the social graph. The follows table uses a unique index on follower+following pairs. Activities are created server-side when users share outfits or create capsules, then surfaced in a chronological feed filtered to followed users. Likes use a toggle pattern (POST to add, DELETE to remove) with unique constraints. Public profile pages are added to the Clerk middleware public routes.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, Clerk Auth, Tailwind CSS 4, Vitest

---

## File Structure

```
src/
├── db/
│   ├── schema/
│   │   ├── follows.ts                              # NEW: follows table
│   │   ├── activities.ts                           # NEW: activities table
│   │   └── likes.ts                                # NEW: likes table
│   └── index.ts                                    # MODIFY: Register new tables
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   └── [id]/
│   │   │       ├── follow/
│   │   │       │   └── route.ts                    # NEW: POST/DELETE follow
│   │   │       ├── followers/
│   │   │       │   └── route.ts                    # NEW: GET followers
│   │   │       └── following/
│   │   │           └── route.ts                    # NEW: GET following
│   │   ├── feed/
│   │   │   └── route.ts                            # NEW: GET activity feed
│   │   └── outfits/
│   │       └── [id]/
│   │           └── like/
│   │               └── route.ts                    # NEW: POST/DELETE like
│   ├── (public)/
│   │   └── users/
│   │       └── [id]/
│   │           └── page.tsx                        # NEW: Public profile page
│   └── (auth)/
│       └── feed/
│           ├── page.tsx                            # NEW: Feed page (server)
│           └── client.tsx                          # NEW: Feed page (client)
├── components/
│   ├── social/
│   │   ├── follow-button.tsx                       # NEW: Follow/unfollow toggle
│   │   ├── activity-card.tsx                       # NEW: Activity feed card
│   │   └── like-button.tsx                         # NEW: Heart icon like toggle
│   └── layout/
│       └── nav.tsx                                 # MODIFY: Add Feed nav link
├── middleware.ts                                    # MODIFY: Add /users/* to public routes
tests/
├── db/
│   ├── follows-schema.test.ts                      # NEW
│   ├── activities-schema.test.ts                   # NEW
│   └── likes-schema.test.ts                        # NEW
├── api/
│   ├── users/
│   │   ├── follow.test.ts                          # NEW
│   │   ├── followers.test.ts                       # NEW
│   │   └── following.test.ts                       # NEW
│   ├── feed/
│   │   └── feed.test.ts                            # NEW
│   └── outfits/
│       └── like.test.ts                            # NEW
```

---

## Task 1: Following System Schema + API

**Files:**
- Create: `src/db/schema/follows.ts`
- Modify: `src/db/index.ts`
- Create: `src/app/api/users/[id]/follow/route.ts`
- Create: `src/app/api/users/[id]/followers/route.ts`
- Create: `src/app/api/users/[id]/following/route.ts`
- Test: `tests/db/follows-schema.test.ts`
- Test: `tests/api/users/follow.test.ts`
- Test: `tests/api/users/followers.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/db/follows-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { followsTable } from "@/db/schema/follows";

describe("follows schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(followsTable);
    expect(columns).toContain("id");
    expect(columns).toContain("followerId");
    expect(columns).toContain("followingId");
    expect(columns).toContain("createdAt");
  });
});
```

`tests/api/users/follow.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { POST, DELETE } from "@/app/api/users/[id]/follow/route";
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
          returning: vi.fn().mockResolvedValue([{ id: "follow-1" }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));
vi.mock("@/db/schema/follows", () => ({
  followsTable: { followerId: "follower_id", followingId: "following_id" },
}));

describe("POST /api/users/[id]/follow", () => {
  it("creates a follow relationship", async () => {
    const req = new NextRequest("http://localhost/api/users/target-user/follow", {
      method: "POST",
    });
    const params = Promise.resolve({ id: "target-user" });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/users/[id]/follow", () => {
  it("removes a follow relationship", async () => {
    const req = new NextRequest("http://localhost/api/users/target-user/follow", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "target-user" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
  });
});
```

`tests/api/users/followers.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { GET as getFollowers } from "@/app/api/users/[id]/followers/route";
import { GET as getFollowing } from "@/app/api/users/[id]/following/route";
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
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "user-2", displayName: "Jane Doe" },
          ]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/follows", () => ({
  followsTable: {
    followerId: "follower_id",
    followingId: "following_id",
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", displayName: "display_name" },
}));

describe("GET /api/users/[id]/followers", () => {
  it("returns list of followers", async () => {
    const req = new NextRequest("http://localhost/api/users/target-user/followers");
    const params = Promise.resolve({ id: "target-user" });
    const res = await getFollowers(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toBeDefined();
  });
});

describe("GET /api/users/[id]/following", () => {
  it("returns list of followed users", async () => {
    const req = new NextRequest("http://localhost/api/users/target-user/following");
    const params = Promise.resolve({ id: "target-user" });
    const res = await getFollowing(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/db/follows-schema.test.ts tests/api/users/`
Expected: FAIL — modules not found

- [ ] **Step 3: Create follows schema**

`src/db/schema/follows.ts`:
```typescript
import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const followsTable = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("follow_unique").on(table.followerId, table.followingId),
  ],
);

export type Follow = typeof followsTable.$inferSelect;
export type NewFollow = typeof followsTable.$inferInsert;
```

- [ ] **Step 4: Register in db/index.ts**

Add to `src/db/index.ts`:
```typescript
import { followsTable } from "./schema/follows";
```

Add to schema object:
```typescript
follows: followsTable,
```

- [ ] **Step 5: Create follow/unfollow API**

`src/app/api/users/[id]/follow/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { followsTable } from "@/db/schema/follows";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: targetUserId } = await params;

  if (dbUserId === targetUserId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const [follow] = await db
    .insert(followsTable)
    .values({ followerId: dbUserId, followingId: targetUserId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ followed: follow ?? true }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: targetUserId } = await params;

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.followerId, dbUserId),
        eq(followsTable.followingId, targetUserId),
      ),
    );

  return NextResponse.json({ unfollowed: true });
}
```

- [ ] **Step 6: Create followers endpoint**

`src/app/api/users/[id]/followers/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(clerkId);

  const { id: targetUserId } = await params;

  const followers = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      createdAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
    .where(eq(followsTable.followingId, targetUserId));

  return NextResponse.json({ users: followers });
}
```

- [ ] **Step 7: Create following endpoint**

`src/app/api/users/[id]/following/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUser(clerkId);

  const { id: targetUserId } = await params;

  const following = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      createdAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
    .where(eq(followsTable.followerId, targetUserId));

  return NextResponse.json({ users: following });
}
```

- [ ] **Step 8: Push schema + run tests**

Run: `pnpm db:push && pnpm vitest run tests/db/follows-schema.test.ts tests/api/users/`
Expected: PASS — all tests

**Commit:** `feat: add following system with follows schema, follow/unfollow API, and follower/following endpoints`

---

## Task 2: Public Profile Pages

**Files:**
- Create: `src/app/(public)/users/[id]/page.tsx`
- Create: `src/components/social/follow-button.tsx`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add public route to middleware**

In `src/middleware.ts`, add `/users/(.*)` to the `isPublicRoute` matcher:

```typescript
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/welcome",
  "/shared/(.*)",
  "/users/(.*)",
  "/api/webhooks/(.*)",
  "/api/shared/(.*)",
  "/sitemap.xml",
  "/robots.txt",
]);
```

- [ ] **Step 2: Create FollowButton component**

`src/components/social/follow-button.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
      if (res.ok) {
        setFollowing(!following);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-6 py-2 text-label-lg uppercase tracking-widest transition-colors disabled:opacity-50 ${
        following
          ? "bg-surface-container-high text-on-surface ghost-border"
          : "editorial-gradient text-white"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
```

- [ ] **Step 3: Create public profile page**

`src/app/(public)/users/[id]/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { outfitsTable } from "@/db/schema/outfits";
import { followsTable } from "@/db/schema/follows";
import { ensureUser } from "@/lib/auth/ensure-user";
import { FollowButton } from "@/components/social/follow-button";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the profile user
  const profileUser = await db.query.users.findFirst({
    where: eq(usersTable.id, id),
  });

  if (!profileUser) notFound();

  // Fetch shared outfits (ones with shareToken set)
  const sharedOutfits = await db
    .select()
    .from(outfitsTable)
    .where(and(eq(outfitsTable.userId, id)));

  const publicOutfits = sharedOutfits.filter((o) => o.shareToken);

  // Get follower/following counts
  const followers = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followingId, id));

  const following = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followerId, id));

  // Check if current user follows this profile
  let isFollowing = false;
  const { userId: clerkId } = await auth();
  let currentDbUserId: string | null = null;
  if (clerkId) {
    currentDbUserId = await ensureUser(clerkId);
    if (currentDbUserId) {
      const existingFollow = followers.find((f) => f.followerId === currentDbUserId);
      isFollowing = !!existingFollow;
    }
  }

  const isOwnProfile = currentDbUserId === id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-display-sm text-on-surface">
            {profileUser.displayName || "User"}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Member since{" "}
            {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex gap-6 mt-3">
            <span className="text-body-md text-on-surface">
              <strong className="font-serif">{followers.length}</strong>{" "}
              <span className="text-on-surface-variant">followers</span>
            </span>
            <span className="text-body-md text-on-surface">
              <strong className="font-serif">{following.length}</strong>{" "}
              <span className="text-on-surface-variant">following</span>
            </span>
          </div>
        </div>

        {clerkId && !isOwnProfile && (
          <FollowButton
            targetUserId={id}
            initialFollowing={isFollowing}
          />
        )}
      </div>

      {/* Shared Outfits Gallery */}
      <section>
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Shared Outfits
        </h2>
        {publicOutfits.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            No shared outfits yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {publicOutfits.map((outfit) => (
              <a
                key={outfit.id}
                href={`/shared/outfits/${outfit.shareToken}`}
                className="bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
              >
                <p className="font-serif text-title-md text-on-surface">
                  {outfit.name}
                </p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  {new Date(outfit.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: No errors.

**Commit:** `feat: add public profile pages with follow button and shared outfit gallery`

---

## Task 3: Activity Feed

**Files:**
- Create: `src/db/schema/activities.ts`
- Modify: `src/db/index.ts`
- Create: `src/app/api/feed/route.ts`
- Create: `src/app/(auth)/feed/page.tsx`
- Create: `src/app/(auth)/feed/client.tsx`
- Create: `src/components/social/activity-card.tsx`
- Modify: `src/components/layout/nav.tsx`
- Test: `tests/db/activities-schema.test.ts`
- Test: `tests/api/feed/feed.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/db/activities-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { activitiesTable } from "@/db/schema/activities";

describe("activities schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(activitiesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("type");
    expect(columns).toContain("referenceId");
    expect(columns).toContain("metadata");
    expect(columns).toContain("createdAt");
  });
});
```

`tests/api/feed/feed.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/feed/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));

const mockActivities = [
  {
    id: "act-1",
    userId: "user-2",
    type: "shared_outfit",
    referenceId: "outfit-1",
    metadata: { outfitName: "Spring Look" },
    createdAt: new Date(),
    displayName: "Jane Doe",
  },
];

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockActivities),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/activities", () => ({
  activitiesTable: {
    userId: "user_id",
    type: "type",
    createdAt: "created_at",
  },
  activityTypeEnum: {},
}));
vi.mock("@/db/schema/follows", () => ({
  followsTable: { followerId: "follower_id", followingId: "following_id" },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", displayName: "display_name" },
}));

describe("GET /api/feed", () => {
  it("returns activities from followed users", async () => {
    const req = new NextRequest("http://localhost/api/feed");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/db/activities-schema.test.ts tests/api/feed/`
Expected: FAIL — modules not found

- [ ] **Step 3: Create activities schema**

`src/db/schema/activities.ts`:
```typescript
import {
  pgTable,
  uuid,
  text,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const activityTypeEnum = pgEnum("activity_type", [
  "shared_outfit",
  "new_capsule",
]);

export const activitiesTable = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  referenceId: uuid("reference_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;
```

- [ ] **Step 4: Register in db/index.ts**

Add to `src/db/index.ts`:
```typescript
import { activitiesTable } from "./schema/activities";
```

Add to schema object:
```typescript
activities: activitiesTable,
```

- [ ] **Step 5: Push schema**

Run: `pnpm db:push`

- [ ] **Step 6: Create feed API endpoint**

`src/app/api/feed/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activitiesTable } from "@/db/schema/activities";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24"), 50);

  // Get IDs of users being followed
  const followedUsers = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, dbUserId));

  const followedIds = followedUsers.map((f) => f.followingId);

  if (followedIds.length === 0) {
    return NextResponse.json({ activities: [] });
  }

  // Fetch activities from followed users
  const activities = await db
    .select({
      id: activitiesTable.id,
      userId: activitiesTable.userId,
      type: activitiesTable.type,
      referenceId: activitiesTable.referenceId,
      metadata: activitiesTable.metadata,
      createdAt: activitiesTable.createdAt,
      displayName: usersTable.displayName,
    })
    .from(activitiesTable)
    .innerJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
    .where(inArray(activitiesTable.userId, followedIds))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit);

  return NextResponse.json({ activities });
}
```

- [ ] **Step 7: Create feed page**

`src/app/(auth)/feed/page.tsx`:
```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activitiesTable } from "@/db/schema/activities";
import { followsTable } from "@/db/schema/follows";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { FeedClient } from "./client";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const followedUsers = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, dbUserId));

  const followedIds = followedUsers.map((f) => f.followingId);

  let activities: any[] = [];
  if (followedIds.length > 0) {
    activities = await db
      .select({
        id: activitiesTable.id,
        userId: activitiesTable.userId,
        type: activitiesTable.type,
        referenceId: activitiesTable.referenceId,
        metadata: activitiesTable.metadata,
        createdAt: activitiesTable.createdAt,
        displayName: usersTable.displayName,
      })
      .from(activitiesTable)
      .innerJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
      .where(inArray(activitiesTable.userId, followedIds))
      .orderBy(desc(activitiesTable.createdAt))
      .limit(24);
  }

  return <FeedClient activities={activities} />;
}
```

`src/app/(auth)/feed/client.tsx`:
```typescript
"use client";

import { ActivityCard } from "@/components/social/activity-card";
import { EmptyState } from "@/components/empty-state";

interface ActivityItem {
  id: string;
  userId: string;
  type: "shared_outfit" | "new_capsule";
  referenceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  displayName: string;
}

interface Props {
  activities: ActivityItem[];
}

export function FeedClient({ activities }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-display-sm text-on-surface mb-8">
        Feed
      </h1>

      {activities.length === 0 ? (
        <EmptyState
          title="Your feed is empty"
          description="Follow other users to see their shared outfits and capsule wardrobes here."
        />
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create ActivityCard component**

`src/components/social/activity-card.tsx`:
```typescript
"use client";

import Link from "next/link";

interface ActivityItem {
  id: string;
  userId: string;
  type: "shared_outfit" | "new_capsule";
  referenceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  displayName: string;
}

interface Props {
  activity: ActivityItem;
}

const TYPE_LABELS: Record<string, string> = {
  shared_outfit: "shared an outfit",
  new_capsule: "created a capsule",
};

export function ActivityCard({ activity }: Props) {
  const label = TYPE_LABELS[activity.type] ?? activity.type;
  const itemName = (activity.metadata?.outfitName ?? activity.metadata?.capsuleName ?? "") as string;

  const href =
    activity.type === "shared_outfit"
      ? `/outfits/${activity.referenceId}`
      : `/capsules/${activity.referenceId}`;

  return (
    <div className="bg-surface-container p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-lg text-on-surface">
            <Link
              href={`/users/${activity.userId}`}
              className="font-serif text-primary hover:underline"
            >
              {activity.displayName}
            </Link>{" "}
            {label}
          </p>
          {itemName && (
            <Link
              href={href}
              className="text-body-md text-on-surface-variant hover:text-on-surface mt-1 inline-block"
            >
              {itemName}
            </Link>
          )}
        </div>
        <span className="text-body-md text-on-surface-variant whitespace-nowrap ml-4">
          {new Date(activity.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Add Feed nav link**

In `src/components/layout/nav.tsx`, add:

```typescript
{ href: "/feed", label: "Feed" },
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `pnpm vitest run tests/db/activities-schema.test.ts tests/api/feed/`
Expected: PASS — all tests

**Commit:** `feat: add activity feed with activities schema, feed API, and feed page`

---

## Task 4: Like/Save System

**Files:**
- Create: `src/db/schema/likes.ts`
- Modify: `src/db/index.ts`
- Create: `src/app/api/outfits/[id]/like/route.ts`
- Create: `src/components/social/like-button.tsx`
- Test: `tests/db/likes-schema.test.ts`
- Test: `tests/api/outfits/like.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/db/likes-schema.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { likesTable } from "@/db/schema/likes";

describe("likes schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(likesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("outfitId");
    expect(columns).toContain("createdAt");
  });
});
```

`tests/api/outfits/like.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { POST, DELETE } from "@/app/api/outfits/[id]/like/route";
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
          returning: vi.fn().mockResolvedValue([{ id: "like-1" }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/likes", () => ({
  likesTable: { userId: "user_id", outfitId: "outfit_id" },
}));

describe("POST /api/outfits/[id]/like", () => {
  it("likes an outfit", async () => {
    const req = new NextRequest("http://localhost/api/outfits/outfit-1/like", {
      method: "POST",
    });
    const params = Promise.resolve({ id: "outfit-1" });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.liked).toBe(true);
  });
});

describe("DELETE /api/outfits/[id]/like", () => {
  it("unlikes an outfit", async () => {
    const req = new NextRequest("http://localhost/api/outfits/outfit-1/like", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "outfit-1" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unliked).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/db/likes-schema.test.ts tests/api/outfits/like.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create likes schema**

`src/db/schema/likes.ts`:
```typescript
import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { outfitsTable } from "./outfits";

export const likesTable = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfitsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("like_unique").on(table.userId, table.outfitId),
  ],
);

export type Like = typeof likesTable.$inferSelect;
export type NewLike = typeof likesTable.$inferInsert;
```

- [ ] **Step 4: Register in db/index.ts**

Add to `src/db/index.ts`:
```typescript
import { likesTable } from "./schema/likes";
```

Add to schema object:
```typescript
likes: likesTable,
```

- [ ] **Step 5: Push schema**

Run: `pnpm db:push`

- [ ] **Step 6: Create like/unlike API**

`src/app/api/outfits/[id]/like/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { likesTable } from "@/db/schema/likes";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: outfitId } = await params;

  await db
    .insert(likesTable)
    .values({ userId: dbUserId, outfitId })
    .onConflictDoNothing()
    .returning();

  // Return updated like count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.outfitId, outfitId));

  return NextResponse.json({ liked: true, likeCount: count }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: outfitId } = await params;

  await db
    .delete(likesTable)
    .where(
      and(
        eq(likesTable.userId, dbUserId),
        eq(likesTable.outfitId, outfitId),
      ),
    );

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.outfitId, outfitId));

  return NextResponse.json({ unliked: true, likeCount: count });
}
```

- [ ] **Step 7: Create LikeButton component**

`src/components/social/like-button.tsx`:
```typescript
"use client";

import { useState } from "react";

interface Props {
  outfitId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ outfitId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/outfits/${outfitId}/like`, { method });
      if (res.ok) {
        const data = await res.json();
        setLiked(!liked);
        setCount(data.likeCount);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-body-md transition-colors disabled:opacity-50"
      aria-label={liked ? "Unlike outfit" : "Like outfit"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={liked ? 0 : 1.5}
        className={`w-5 h-5 ${liked ? "text-primary" : "text-on-surface-variant"}`}
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
      <span className={liked ? "text-primary" : "text-on-surface-variant"}>
        {count}
      </span>
    </button>
  );
}
```

- [ ] **Step 8: Add like button to shared outfit cards**

Wire the `LikeButton` component into outfit cards that display shared outfits (e.g., on public profile pages, feed activity cards, and the shared outfit page). Example integration in the shared outfit page:

```typescript
// In outfit card or shared outfit display:
import { LikeButton } from "@/components/social/like-button";

// Render alongside outfit info:
<LikeButton
  outfitId={outfit.id}
  initialLiked={userHasLiked}
  initialCount={likeCount}
/>
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm vitest run tests/db/likes-schema.test.ts tests/api/outfits/like.test.ts`
Expected: PASS — all tests

- [ ] **Step 10: Verify full test suite**

Run: `pnpm vitest run tests/db/follows-schema.test.ts tests/db/activities-schema.test.ts tests/db/likes-schema.test.ts tests/api/users/ tests/api/feed/ tests/api/outfits/like.test.ts`
Expected: PASS — all social feature tests green

**Commit:** `feat: add like/save system with likes schema, toggle API, and heart button component`
