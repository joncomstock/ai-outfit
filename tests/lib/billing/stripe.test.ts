import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCheckoutCreate, mockPortalCreate, mockCustomerCreate } = vi.hoisted(() => ({
  mockCheckoutCreate: vi.fn().mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/cs_test_123",
  }),
  mockPortalCreate: vi.fn().mockResolvedValue({
    url: "https://billing.stripe.com/session/bps_test_123",
  }),
  mockCustomerCreate: vi.fn().mockResolvedValue({
    id: "cus_test_123",
  }),
}));

vi.mock("stripe", () => {
  class MockStripe {
    checkout = { sessions: { create: mockCheckoutCreate } };
    billingPortal = { sessions: { create: mockPortalCreate } };
    customers = { create: mockCustomerCreate };
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
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: "db-user-uuid",
          stripeCustomerId: null,
          email: "test@example.com",
        }),
      },
    },
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", stripeCustomerId: "stripe_customer_id" },
}));

import {
  createCheckoutSession,
  createCustomerPortalSession,
  getOrCreateCustomer,
} from "@/lib/billing/stripe";

describe("stripe helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_ID = "price_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("createCheckoutSession returns checkout URL", async () => {
    const result = await createCheckoutSession("db-user-uuid", "cus_test_123");
    expect(mockCheckoutCreate).toHaveBeenCalledOnce();
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("createCustomerPortalSession returns portal URL", async () => {
    const result = await createCustomerPortalSession("cus_test_123");
    expect(mockPortalCreate).toHaveBeenCalledOnce();
    expect(result.url).toContain("billing.stripe.com");
  });

  it("getOrCreateCustomer creates new customer when none exists", async () => {
    const customerId = await getOrCreateCustomer("db-user-uuid");
    expect(mockCustomerCreate).toHaveBeenCalledOnce();
    expect(customerId).toBe("cus_test_123");
  });
});
