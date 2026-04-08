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
