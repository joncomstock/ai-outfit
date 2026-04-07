import { GET, PUT } from "@/app/api/fit-profile/route";
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
      fitProfiles: {
        findFirst: vi.fn().mockResolvedValue({
          id: "fp-1",
          userId: "db-user-uuid",
          heightCm: 178,
          weightKg: 75,
          chestCm: 96,
          waistCm: 82,
          hipsCm: 95,
          shouldersCm: 45,
          inseamCm: 81,
          brandFitNotes: { "Nike": "runs small" },
        }),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: "fp-1",
            userId: "db-user-uuid",
            heightCm: 178,
            weightKg: 75,
            chestCm: 96,
            waistCm: 82,
            hipsCm: 95,
            shouldersCm: 45,
            inseamCm: 81,
            brandFitNotes: { "Nike": "runs small" },
          }]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/fit-profiles", () => ({
  fitProfilesTable: { id: "id", userId: "user_id" },
}));

describe("GET /api/fit-profile", () => {
  it("returns fit profile", async () => {
    const req = new NextRequest("http://localhost/api/fit-profile");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.heightCm).toBe(178);
  });
});

describe("PUT /api/fit-profile", () => {
  it("upserts fit profile", async () => {
    const req = new NextRequest("http://localhost/api/fit-profile", {
      method: "PUT",
      body: JSON.stringify({ heightCm: 178, weightKg: 75 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });
});
