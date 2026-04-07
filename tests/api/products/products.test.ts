import { GET as listProducts } from "@/app/api/products/route";
import { GET as getProduct } from "@/app/api/products/[id]/route";
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
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([
                { id: "prod-1", name: "Oversized Raincoat", brand: "Lemaire", category: "outerwear", price: 1150 },
              ]),
            }),
          }),
        }),
      }),
    }),
    query: {
      products: {
        findFirst: vi.fn().mockResolvedValue({
          id: "prod-1",
          name: "Oversized Raincoat",
          brand: "Lemaire",
          category: "outerwear",
          price: 1150,
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/products", () => ({
  productsTable: {
    id: "id",
    category: "category",
    brand: "brand",
    inStock: "in_stock",
    createdAt: "created_at",
    price: "price",
    name: "name",
  },
}));

describe("GET /api/products", () => {
  it("returns product list", async () => {
    const req = new NextRequest("http://localhost/api/products");
    const res = await listProducts(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0]).toHaveProperty("name", "Oversized Raincoat");
  });
});

describe("GET /api/products/[id]", () => {
  it("returns single product", async () => {
    const req = new NextRequest("http://localhost/api/products/prod-1");
    const params = Promise.resolve({ id: "prod-1" });
    const res = await getProduct(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Oversized Raincoat");
  });
});
