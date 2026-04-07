import { POST } from "@/app/api/outfits/[id]/share/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/lib/sharing/generate-token", () => ({
  generateShareToken: vi.fn().mockReturnValue("abcdef1234567890abcdef1234567890"),
}));
vi.mock("@/db", () => ({
  db: {
    query: {
      outfits: {
        findFirst: vi.fn().mockResolvedValue({ id: "outfit-1", userId: "db-user-uuid", shareToken: null }),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "outfit-1", shareToken: "abcdef1234567890abcdef1234567890" }]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", userId: "user_id", shareToken: "share_token" },
}));

describe("POST /api/outfits/[id]/share", () => {
  it("generates a share token and returns share URL", async () => {
    const req = new NextRequest("http://localhost/api/outfits/outfit-1/share", { method: "POST" });
    const params = Promise.resolve({ id: "outfit-1" });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shareToken).toBe("abcdef1234567890abcdef1234567890");
    expect(body.shareUrl).toContain("/shared/outfits/abcdef1234567890abcdef1234567890");
  });
});
