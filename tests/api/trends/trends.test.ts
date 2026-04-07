import { GET as listTrends } from "@/app/api/trends/route";
import { GET as getTrend } from "@/app/api/trends/[id]/route";
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
            { id: "trend-1", name: "Sculptural Minimalism", momentumScore: 94, status: "published" },
          ]),
        }),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    query: {
      trends: {
        findFirst: vi.fn().mockResolvedValue({
          id: "trend-1",
          name: "Sculptural Minimalism",
          momentumScore: 94,
        }),
      },
      savedTrends: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: {
    id: "id",
    status: "status",
    category: "category",
    momentumScore: "momentum_score",
    createdAt: "created_at",
  },
  trendProductsTable: {},
  savedTrendsTable: {},
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {},
}));

describe("GET /api/trends", () => {
  it("returns published trends", async () => {
    const req = new NextRequest("http://localhost/api/trends");
    const res = await listTrends(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trends).toHaveLength(1);
    expect(body.trends[0]).toHaveProperty("name", "Sculptural Minimalism");
  });
});

describe("GET /api/trends/[id]", () => {
  it("returns single trend", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1");
    const params = Promise.resolve({ id: "trend-1" });
    const res = await getTrend(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trend).toHaveProperty("name", "Sculptural Minimalism");
  });
});
