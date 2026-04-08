import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/admin/revenue/route";
import { NextRequest } from "next/server";

const { mockClicks } = vi.hoisted(() => {
  const mockClicks = [
    { provider: "rakuten", date: "2026-04-07", count: 15 },
    { provider: "shopstyle", date: "2026-04-07", count: 8 },
    { provider: "rakuten", date: "2026-04-06", count: 12 },
  ];
  return { mockClicks };
});

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

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn().mockResolvedValue({ id: "db-admin-uuid", clerkId: "clerk_admin_123" }) },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockClicks),
          }),
        }),
      }),
    }),
  },
}));

describe("GET /api/admin/revenue", () => {
  it("returns click counts grouped by provider and date", async () => {
    const req = new NextRequest("http://localhost/api/admin/revenue");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clicks).toBeDefined();
  });
});
