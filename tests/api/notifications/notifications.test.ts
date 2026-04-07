import { GET, PATCH } from "@/app/api/notifications/route";
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
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "notif-1",
                userId: "db-user-uuid",
                type: "outfit_ready",
                title: "Your outfit is ready",
                body: "A new outfit has been generated.",
                readAt: null,
                createdAt: new Date().toISOString(),
              },
            ]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "notif-1",
              userId: "db-user-uuid",
              type: "outfit_ready",
              title: "Your outfit is ready",
              body: "A new outfit has been generated.",
              readAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/notifications", () => ({
  notificationsTable: { id: "id", userId: "user_id", readAt: "read_at", createdAt: "created_at" },
  notificationTypeEnum: {},
}));

describe("GET /api/notifications", () => {
  it("returns user notifications", async () => {
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].type).toBe("outfit_ready");
  });
});

describe("PATCH /api/notifications", () => {
  it("marks notification as read", async () => {
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id: "notif-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.readAt).toBeTruthy();
  });
});
