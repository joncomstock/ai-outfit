import { GET } from "@/app/api/admin/stats/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    publicMetadata: { role: "admin" },
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("admin-user-uuid"),
}));
vi.mock("@/db", () => {
  const fromResult = [{ value: 42 }];
  const whereMock = vi.fn().mockResolvedValue(fromResult);
  const andWhereMock = vi.fn().mockResolvedValue(fromResult);
  const fromMock = vi.fn().mockImplementation(() => {
    const result = Promise.resolve(fromResult);
    (result as any).where = vi.fn().mockImplementation(() => {
      const r = Promise.resolve(fromResult);
      (r as any).where = andWhereMock;
      return r;
    });
    return result;
  });
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: fromMock,
      }),
    },
  };
});
vi.mock("@/db/schema/users", () => ({ usersTable: {} }));
vi.mock("@/db/schema/products", () => ({ productsTable: {} }));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: { status: "status" },
  trendProductsTable: {},
  savedTrendsTable: {},
}));
vi.mock("@/db/schema/affiliate", () => ({ affiliateClicksTable: { createdAt: "created_at" } }));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { createdAt: "created_at", shareToken: "share_token" },
  outfitSlotsTable: {},
}));
vi.mock("@/db/schema/closet-items", () => ({ closetItemsTable: { createdAt: "created_at" } }));

describe("GET /api/admin/stats", () => {
  it("returns dashboard stats", async () => {
    const req = new NextRequest("http://localhost/api/admin/stats");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalUsers");
    expect(body).toHaveProperty("totalProducts");
    expect(body).toHaveProperty("activeTrends");
    expect(body).toHaveProperty("totalClicks");
    expect(body).toHaveProperty("totalOutfits");
    expect(body).toHaveProperty("totalClosetItems");
    expect(body).toHaveProperty("sharedOutfits");
    expect(body).toHaveProperty("range");
  });

  it("accepts time range parameter", async () => {
    const req = new NextRequest("http://localhost/api/admin/stats?range=30d");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.range).toBe("30d");
  });
});
