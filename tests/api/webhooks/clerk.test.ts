import { POST } from "@/app/api/webhooks/clerk/route";
import { NextRequest } from "next/server";

vi.mock("svix", () => ({
  Webhook: class {
    verify() {
      return {
        type: "user.created",
        data: {
          id: "user_test123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
        },
      };
    }
  },
}));

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock("@/db/schema/users", () => ({
  usersTable: "users_table_mock",
}));

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = "test_webhook_secret";
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  it("creates a user on user.created event", async () => {
    const { db } = await import("@/db");
    const req = new NextRequest("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: JSON.stringify({ type: "user.created", data: {} }),
      headers: {
        "svix-id": "msg_test",
        "svix-timestamp": "1234567890",
        "svix-signature": "v1,test",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
  });
});
