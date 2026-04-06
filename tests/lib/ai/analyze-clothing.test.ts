import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted to the top of the file by vitest.
// Any variables referenced inside the factory must be initialized before
// the factory body runs. Using a getter defers the reference until
// MockAnthropic is actually instantiated (not at class definition time).
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  class MockAnthropic {
    messages = { create: mockCreate };
    static _mockCreate = mockCreate;
  }
  return { default: MockAnthropic };
});

vi.mock("@/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "item-123", userId: "db-user-uuid" }]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: "db-user-uuid", onboardingState: "first_upload" }),
      },
    },
  },
}));

vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { id: "id" },
}));

vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", clerkId: "clerk_id" },
}));

vi.mock("@/lib/jobs/job-store", () => ({
  updateJobStatus: vi.fn(),
}));

import { analyzeClothingImage } from "@/lib/ai/analyze-clothing";
import { updateJobStatus } from "@/lib/jobs/job-store";
import AnthropicSDK from "@anthropic-ai/sdk";

const MockAnthropic = AnthropicSDK as any;

const successResponse = {
  content: [
    {
      type: "text",
      text: JSON.stringify({
        category: "tops",
        subCategory: "t-shirt",
        colors: ["#FFFFFF", "#1A1A1A"],
        fit: "regular",
        seasonality: ["spring", "summer"],
        styleTags: ["casual", "minimal", "everyday"],
      }),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  MockAnthropic._mockCreate.mockResolvedValue(successResponse);
});

describe("analyzeClothingImage", () => {
  it("calls Claude Vision and updates the item with results", async () => {
    await analyzeClothingImage("item-123", "https://blob.test/shirt.jpg", "job-456");

    expect(updateJobStatus).toHaveBeenCalledWith("job-456", "analyzing");
    expect(updateJobStatus).toHaveBeenCalledWith("job-456", "ready");
  });

  it("marks job as error when analysis fails", async () => {
    MockAnthropic._mockCreate.mockRejectedValueOnce(new Error("API error"));

    await analyzeClothingImage("item-999", "https://blob.test/fail.jpg", "job-789");

    expect(updateJobStatus).toHaveBeenCalledWith("job-789", "error", expect.any(String));
  });
});
