import { GET } from "@/app/api/closet/stats/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { category: "tops", colors: ["#fff"], styleTags: ["casual"], status: "ready" },
          { category: "tops", colors: ["#000"], styleTags: ["formal"], status: "ready" },
          { category: "bottoms", colors: ["#00f"], styleTags: ["casual"], status: "ready" },
          { category: null, colors: [], styleTags: [], status: "processing" },
        ]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: "db-user-uuid" }),
      },
    },
  },
}));

vi.mock("@/db/schema/users", () => ({
  usersTable: { clerkId: "clerk_id" },
}));

vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { userId: "user_id" },
}));

describe("GET /api/closet/stats", () => {
  it("returns category counts and color distribution", async () => {
    const req = new NextRequest("http://localhost/api/closet/stats");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalItems).toBe(4);
    expect(body.readyItems).toBe(3);
    expect(body.categoryCounts).toEqual({ tops: 2, bottoms: 1 });
  });
});
