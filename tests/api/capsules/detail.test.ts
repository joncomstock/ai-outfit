import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/capsules/[id]/route";
import { NextRequest } from "next/server";

const { mockCapsule } = vi.hoisted(() => ({
  mockCapsule: {
    id: "capsule-1",
    userId: "db-user-uuid",
    name: "Spring Capsule",
    description: "A versatile spring collection",
    season: "spring",
    theme: "casual",
    pieces: ["item-1", "item-2"],
    gapAnalysis: [{ category: "shoes", description: "Needs white sneakers", searchQuery: "white sneakers" }],
    createdAt: new Date(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));

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
