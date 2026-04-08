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
