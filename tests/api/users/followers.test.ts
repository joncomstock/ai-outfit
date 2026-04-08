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
