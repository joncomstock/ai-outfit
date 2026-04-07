import { GET, DELETE } from "@/app/api/admin/outfits/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_admin_123" }),
  currentUser: vi.fn().mockResolvedValue({
    publicMetadata: { role: "admin" },
  }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("admin-uuid"),
}));

vi.mock("@/db", () => {
  const mockOutfits = [
    {
      id: "outfit-1",
      name: "Spring Look",
      generationMode: "for_you",
      rating: 4,
      shareToken: "abc123",
      createdAt: new Date().toISOString(),
      userEmail: "user@test.com",
      userDisplayName: "Test User",
    },
  ];
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockOutfits),
              }),
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    },
  };
});
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", userId: "user_id", createdAt: "created_at" },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", email: "email", displayName: "display_name" },
}));

describe("GET /api/admin/outfits", () => {
  it("returns paginated outfit list with user info", async () => {
    const req = new NextRequest("http://localhost/api/admin/outfits?page=1&limit=20");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outfits).toHaveLength(1);
  });
});

describe("DELETE /api/admin/outfits", () => {
  it("deletes an outfit", async () => {
    const req = new NextRequest("http://localhost/api/admin/outfits", {
      method: "DELETE",
      body: JSON.stringify({ outfitId: "outfit-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });
});
