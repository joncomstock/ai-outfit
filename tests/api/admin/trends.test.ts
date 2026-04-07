import { POST, PATCH, DELETE } from "@/app/api/admin/trends/route";
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
          { id: "trend-new", name: "Neo Minimalism", slug: "neo-minimalism" },
        ]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "trend-1", name: "Neo Minimalism Updated" },
          ]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  },
}));
vi.mock("@/db/schema/trends", () => ({
  trendsTable: { id: "id" },
}));

describe("POST /api/admin/trends", () => {
  it("creates a new trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "POST",
      body: JSON.stringify({
        name: "Neo Minimalism",
        description: "A new wave of less-is-more",
        heroImageUrl: "https://images.example.com/trend.jpg",
        category: "minimalism",
        momentumScore: 85,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("name", "Neo Minimalism");
  });
});

describe("PATCH /api/admin/trends", () => {
  it("updates a trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "PATCH",
      body: JSON.stringify({ id: "trend-1", name: "Neo Minimalism Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/admin/trends", () => {
  it("deletes a trend", async () => {
    const req = new NextRequest("http://localhost/api/admin/trends", {
      method: "DELETE",
      body: JSON.stringify({ id: "trend-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });
});
