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
  const fromMock = vi.fn().mockImplementation(() => {
    const result = Promise.resolve(fromResult);
    (result as any).where = vi.fn().mockResolvedValue(fromResult);
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
vi.mock("@/db/schema/affiliate", () => ({ affiliateClicksTable: {} }));

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
  });
});
