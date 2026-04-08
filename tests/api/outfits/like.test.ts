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
