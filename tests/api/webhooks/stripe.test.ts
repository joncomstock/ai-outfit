import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockConstructEvent } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
}));

vi.mock("stripe", () => {
  class MockStripe {
    webhooks = { constructEvent: mockConstructEvent };
  }
  return { default: MockStripe };
});
vi.mock("@/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { stripeCustomerId: "stripe_customer_id" },
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { NextRequest } from "next/server";

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  it("processes customer.subscription.created event", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_test_123",
          status: "active",
        },
      },
    });

    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "stripe-signature": "test_sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid signature", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "stripe-signature": "invalid_sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
