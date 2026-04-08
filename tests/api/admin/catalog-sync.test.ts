import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/admin/catalog/sync/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    id: "clerk_admin_123",
    publicMetadata: { role: "admin" },
    emailAddresses: [{ emailAddress: "admin@test.com" }],
    firstName: "Admin",
    lastName: "User",
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-admin-uuid"),
}));
vi.mock("@/lib/affiliates/registry", () => ({
  getProvider: vi.fn().mockReturnValue({
    name: "rakuten",
    searchProducts: vi.fn().mockResolvedValue([]),
    getProduct: vi.fn().mockResolvedValue(null),
  }),
  getAllProviders: vi.fn().mockReturnValue([]),
}));
vi.mock("@/lib/affiliates/sync", () => ({
  syncProducts: vi.fn().mockResolvedValue({ provider: "rakuten", synced: 5, errors: 0 }),
}));
vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn().mockResolvedValue({ id: "db-admin-uuid", clerkId: "clerk_admin_123" }) },
    },
  },
}));

describe("POST /api/admin/catalog/sync", () => {
  it("triggers sync and returns results", async () => {
    const req = new NextRequest("http://localhost/api/admin/catalog/sync", {
      method: "POST",
      body: JSON.stringify({ provider: "rakuten", categories: ["tops"], limit: 20 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(5);
  });
});
