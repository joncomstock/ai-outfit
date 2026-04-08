import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUserFindFirst, mockUsageFindFirst, mockInsert } = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockUsageFindFirst: vi.fn(),
  mockInsert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: mockUserFindFirst },
      usageTracking: { findFirst: mockUsageFindFirst },
    },
    insert: mockInsert,
  },
}));
vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id" },
}));
vi.mock("@/db/schema/usage", () => ({
  usageTrackingTable: {
    userId: "user_id",
    action: "action",
    month: "month",
    count: "count",
  },
}));

import { isPremium, canGenerate, recordUsage } from "@/lib/billing/gates";

describe("feature gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isPremium returns true for premium user", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "premium" });
    expect(await isPremium("user-1")).toBe(true);
  });

  it("isPremium returns false for free user", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    expect(await isPremium("user-1")).toBe(false);
  });

  it("canGenerate returns true for premium user regardless of usage", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "premium" });
    expect(await canGenerate("user-1")).toBe(true);
  });

  it("canGenerate returns true for free user under limit", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce({ count: 3 });
    expect(await canGenerate("user-1")).toBe(true);
  });

  it("canGenerate returns false for free user at limit", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce({ count: 5 });
    expect(await canGenerate("user-1")).toBe(false);
  });

  it("canGenerate returns true for free user with no usage record", async () => {
    mockUserFindFirst.mockResolvedValueOnce({ subscriptionStatus: "free" });
    mockUsageFindFirst.mockResolvedValueOnce(null);
    expect(await canGenerate("user-1")).toBe(true);
  });
});
