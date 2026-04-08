import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/feed/route";
import { NextRequest } from "next/server";

const { mockActivities } = vi.hoisted(() => ({
  mockActivities: [
    {
      id: "act-1",
      userId: "user-2",
      type: "shared_outfit",
      referenceId: "outfit-1",
      metadata: { outfitName: "Spring Look" },
      createdAt: new Date(),
      displayName: "Jane Doe",
    },
  ],
}));

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
        // For the first query: .from().where() returns followed users
        where: vi.fn().mockResolvedValue([{ followingId: "user-2" }]),
        // For the second query: .from().innerJoin().where().orderBy().limit()
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockActivities),
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
