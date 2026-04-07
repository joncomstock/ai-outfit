import { POST } from "@/app/api/admin/catalog/route";
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
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: "prod-new", name: "Cashmere Sweater", brand: "The Row" },
        ]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {},
}));

describe("POST /api/admin/catalog", () => {
  it("creates a product", async () => {
    const req = new NextRequest("http://localhost/api/admin/catalog", {
      method: "POST",
      body: JSON.stringify({
        name: "Cashmere Sweater",
        brand: "The Row",
        category: "tops",
        price: 890,
        imageUrl: "https://images.example.com/sweater.jpg",
        affiliateUrl: "https://shop.example.com/sweater?ref=oe",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Cashmere Sweater");
  });
});
