import { POST, DELETE } from "@/app/api/trends/[id]/save/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "saved-1" }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  },
}));
vi.mock("@/db/schema/trends", () => ({
  savedTrendsTable: { userId: "user_id", trendId: "trend_id" },
}));

describe("POST /api/trends/[id]/save", () => {
  it("bookmarks a trend", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1/save", { method: "POST" });
    const params = Promise.resolve({ id: "trend-1" });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/trends/[id]/save", () => {
  it("removes bookmark", async () => {
    const req = new NextRequest("http://localhost/api/trends/trend-1/save", { method: "DELETE" });
    const params = Promise.resolve({ id: "trend-1" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
  });
});
