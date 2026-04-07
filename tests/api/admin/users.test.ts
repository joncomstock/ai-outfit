import { GET, PATCH } from "@/app/api/admin/users/route";
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
  const mockUsers = [
    {
      id: "user-1",
      email: "user1@test.com",
      displayName: "User One",
      onboardingState: "complete",
      createdAt: new Date().toISOString(),
    },
  ];
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockUsers[0], onboardingState: "signup" }]),
          }),
        }),
      }),
    },
  };
});
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", createdAt: "created_at", onboardingState: "onboarding_state" },
}));

describe("GET /api/admin/users", () => {
  it("returns paginated user list", async () => {
    const req = new NextRequest("http://localhost/api/admin/users?page=1&limit=20");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(1);
  });
});

describe("PATCH /api/admin/users", () => {
  it("updates user onboarding state", async () => {
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "user-1", onboardingState: "signup" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});
