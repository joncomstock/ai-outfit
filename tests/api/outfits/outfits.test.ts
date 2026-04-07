import { GET } from "@/app/api/outfits/route";
import { PATCH } from "@/app/api/outfits/[id]/rate/route";
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
          orderBy: vi.fn().mockResolvedValue([
            { id: "outfit-1", name: "Autumn Essential", generationMode: "for_you" },
          ]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "outfit-1", rating: 4 }]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", userId: "user_id" },
}));

describe("GET /api/outfits", () => {
  it("returns user outfits", async () => {
    const req = new NextRequest("http://localhost/api/outfits");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe("PATCH /api/outfits/[id]/rate", () => {
  it("updates rating", async () => {
    const req = new NextRequest("http://localhost/api/outfits/outfit-1/rate", {
      method: "PATCH",
      body: JSON.stringify({ rating: 4 }),
      headers: { "Content-Type": "application/json" },
    });
    const params = Promise.resolve({ id: "outfit-1" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });
});
