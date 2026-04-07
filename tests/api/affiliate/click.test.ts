import { POST } from "@/app/api/affiliate/click/route";
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
        returning: vi.fn().mockResolvedValue([{ id: "click-1" }]),
      }),
    }),
    query: {
      products: {
        findFirst: vi.fn().mockResolvedValue({
          id: "prod-1",
          affiliateUrl: "https://shop.example.com/product?ref=outfit-engine",
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: { id: "id" },
}));
vi.mock("@/db/schema/affiliate", () => ({
  affiliateClicksTable: {},
}));

describe("POST /api/affiliate/click", () => {
  it("records click and returns affiliate URL", async () => {
    const req = new NextRequest("http://localhost/api/affiliate/click", {
      method: "POST",
      body: JSON.stringify({ productId: "prod-1", sourceContext: "outfit_detail" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("affiliateUrl", "https://shop.example.com/product?ref=outfit-engine");
  });
});
