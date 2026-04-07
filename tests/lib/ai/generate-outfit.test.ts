import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock functions so they can be referenced in both vi.mock factories
// and in test assertions. vi.hoisted runs before module mocking.
const {
  mockCreate,
  mockInsert,
  mockInsertValues,
  mockInsertReturning,
  mockUpdate,
  mockUpdateSet,
  mockUpdateWhere,
  mockSelect,
  mockSelectFrom,
  mockSelectWhere,
  mockFindFirst,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn().mockResolvedValue([{ id: "outfit-uuid-123" }]);
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockSelectWhere = vi.fn();
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

  const mockFindFirst = vi.fn();
  const mockCreate = vi.fn();

  return {
    mockCreate,
    mockInsert,
    mockInsertValues,
    mockInsertReturning,
    mockUpdate,
    mockUpdateSet,
    mockUpdateWhere,
    mockSelect,
    mockSelectFrom,
    mockSelectWhere,
    mockFindFirst,
  };
});

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

vi.mock("@/db", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    query: {
      users: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { id: "id", userId: "user_id", status: "status" },
}));

vi.mock("@/db/schema/users", () => ({
  usersTable: { id: "id", onboardingState: "onboarding_state" },
}));

vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id" },
  outfitSlotsTable: { outfitId: "outfit_id" },
}));

vi.mock("@/lib/jobs/job-store", () => ({
  updateJobStatus: vi.fn(),
}));

import { generateOutfit } from "@/lib/ai/generate-outfit";
import { updateJobStatus } from "@/lib/jobs/job-store";

const OUTFIT_ID = "outfit-uuid-123";
const ITEM_A = "item-top-001";
const ITEM_B = "item-bottom-002";
const ITEM_C = "item-shoes-003";

const mockClosetItems = [
  {
    id: ITEM_A,
    userId: "user-123",
    category: "tops",
    subCategory: "t-shirt",
    colors: ["#FFFFFF"],
    fit: "regular",
    seasonality: ["spring", "summer"],
    styleTags: ["casual"],
    status: "ready",
  },
  {
    id: ITEM_B,
    userId: "user-123",
    category: "bottoms",
    subCategory: "jeans",
    colors: ["#1A1A2E"],
    fit: "slim",
    seasonality: ["spring", "summer", "fall"],
    styleTags: ["casual", "everyday"],
    status: "ready",
  },
  {
    id: ITEM_C,
    userId: "user-123",
    category: "shoes",
    subCategory: "sneakers",
    colors: ["#F5F5F5"],
    fit: "regular",
    seasonality: ["spring", "summer", "fall"],
    styleTags: ["sporty", "casual"],
    status: "ready",
  },
];

const mockUser = {
  id: "user-123",
  stylePreferences: ["casual", "minimal"],
  budgetRange: "mid",
  onboardingState: "first_processed",
};

const successClaudeResponse = {
  content: [
    {
      type: "text",
      text: JSON.stringify({
        name: "The Autumn Essential",
        slots: [
          { slotType: "top", closetItemId: ITEM_A },
          { slotType: "bottom", closetItemId: ITEM_B },
          { slotType: "shoes", closetItemId: ITEM_C },
        ],
      }),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();

  mockCreate.mockResolvedValue(successClaudeResponse);
  mockSelectWhere.mockResolvedValue(mockClosetItems);
  mockFindFirst.mockResolvedValue(mockUser);
  mockInsertReturning.mockResolvedValue([{ id: OUTFIT_ID }]);
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockUpdateWhere.mockResolvedValue(undefined);
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockSelectFrom });
});

describe("generateOutfit", () => {
  it("success path: updates job to analyzing then ready, returns outfit ID", async () => {
    const result = await generateOutfit({
      userId: "user-123",
      mode: "for_you",
      jobId: "job-abc",
    });

    expect(result).toBe(OUTFIT_ID);

    expect(updateJobStatus).toHaveBeenCalledWith("job-abc", "analyzing");
    expect(updateJobStatus).toHaveBeenCalledWith("job-abc", "ready");

    // Ensure analyzing comes before ready
    const calls = (updateJobStatus as ReturnType<typeof vi.fn>).mock.calls;
    const analyzingIdx = calls.findIndex((c: string[]) => c[1] === "analyzing");
    const readyIdx = calls.findIndex((c: string[]) => c[1] === "ready");
    expect(analyzingIdx).toBeLessThan(readyIdx);
  });

  it("error path: updates job to error on failure, returns null", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Claude API failed"));

    const result = await generateOutfit({
      userId: "user-123",
      mode: "for_you",
      jobId: "job-error",
    });

    expect(result).toBeNull();
    expect(updateJobStatus).toHaveBeenCalledWith("job-error", "error", expect.any(String));
    expect(updateJobStatus).not.toHaveBeenCalledWith("job-error", "ready");
  });

  it("error path: returns null when fewer than 3 closet items exist", async () => {
    mockSelectWhere.mockResolvedValueOnce(mockClosetItems.slice(0, 2));

    const result = await generateOutfit({
      userId: "user-123",
      mode: "for_you",
      jobId: "job-too-few",
    });

    expect(result).toBeNull();
    expect(updateJobStatus).toHaveBeenCalledWith("job-too-few", "error", expect.any(String));
  });

  it("updates onboarding state when user is at first_processed", async () => {
    await generateOutfit({
      userId: "user-123",
      mode: "for_you",
      jobId: "job-onboard",
    });

    // db.update should have been called (for onboarding state)
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("style_this mode includes sourceItemId in prompt", async () => {
    await generateOutfit({
      userId: "user-123",
      mode: "style_this",
      sourceItemId: ITEM_A,
      jobId: "job-style",
    });

    const createCall = mockCreate.mock.calls[0][0];
    const userMessage = createCall.messages[0].content;
    expect(userMessage).toContain(ITEM_A);
  });
});
