import { GET, PATCH } from "@/app/api/profile/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: "db-user-uuid",
          email: "user@test.com",
          displayName: "Test User",
          stylePreferences: ["minimalist"],
          sizes: { top: "M", bottom: "32" },
          budgetRange: "mid",
          onboardingState: "complete",
        }),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: "db-user-uuid",
            email: "user@test.com",
            displayName: "Updated Name",
            stylePreferences: ["minimalist"],
            sizes: { top: "M", bottom: "32" },
            budgetRange: "mid",
            onboardingState: "complete",
          }]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", clerkId: "clerk_id" },
}));

describe("GET /api/profile", () => {
  it("returns current user profile", async () => {
    const req = new NextRequest("http://localhost/api/profile");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("user@test.com");
    expect(body.stylePreferences).toContain("minimalist");
  });
});

describe("PATCH /api/profile", () => {
  it("updates user profile fields", async () => {
    const req = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "Updated Name" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.displayName).toBe("Updated Name");
  });
});
