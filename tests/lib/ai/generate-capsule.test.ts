import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

vi.mock("@/db", () => ({
  db: {
    query: {
      closetItems: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "item-1",
            category: "tops",
            subCategory: "t-shirt",
            colors: ["#FFFFFF"],
            fit: "regular",
            seasonality: ["spring", "summer"],
            styleTags: ["casual", "basics"],
          },
          {
            id: "item-2",
            category: "bottoms",
            subCategory: "jeans",
            colors: ["#1A237E"],
            fit: "slim",
            seasonality: ["all"],
            styleTags: ["casual", "denim"],
          },
          {
            id: "item-3",
            category: "shoes",
            subCategory: "sneakers",
            colors: ["#FFFFFF"],
            fit: "regular",
            seasonality: ["all"],
            styleTags: ["casual", "sporty"],
          },
          {
            id: "item-4",
            category: "outerwear",
            subCategory: "denim-jacket",
            colors: ["#5C6BC0"],
            fit: "regular",
            seasonality: ["spring", "fall"],
            styleTags: ["casual", "layering"],
          },
          {
            id: "item-5",
            category: "tops",
            subCategory: "button-down",
            colors: ["#E8E8E8"],
            fit: "regular",
            seasonality: ["all"],
            styleTags: ["smart-casual", "basics"],
          },
        ]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "capsule-1" }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { userId: "user_id", status: "status" },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: {},
  capsuleOutfitsTable: {},
}));

import { generateCapsule } from "@/lib/ai/generate-capsule";

describe("generateCapsule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends closet metadata to Claude and returns capsule result", async () => {
    const mockResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            name: "Casual Spring Capsule",
            description: "A versatile 5-piece capsule for everyday spring wear",
            season: "spring",
            theme: "casual",
            selectedItems: ["item-1", "item-2", "item-3", "item-4", "item-5"],
            outfitCombinations: [
              { name: "Weekend Brunch", slots: [{ slotType: "top", closetItemId: "item-1" }, { slotType: "bottom", closetItemId: "item-2" }, { slotType: "shoes", closetItemId: "item-3" }] },
              { name: "Smart Day Out", slots: [{ slotType: "top", closetItemId: "item-5" }, { slotType: "bottom", closetItemId: "item-2" }, { slotType: "shoes", closetItemId: "item-3" }, { slotType: "outerwear", closetItemId: "item-4" }] },
            ],
            gaps: [
              { category: "accessories", description: "A versatile crossbody bag to complete casual looks", searchQuery: "leather crossbody bag" },
            ],
          }),
        },
      ],
    };
    mockCreate.mockResolvedValueOnce(mockResponse);

    const result = await generateCapsule({ userId: "user-1" });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.name).toBe("Casual Spring Capsule");
    expect(result.selectedItems).toHaveLength(5);
    expect(result.outfitCombinations).toHaveLength(2);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].category).toBe("accessories");
  });

  it("throws on invalid Claude response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "not valid json" }],
    });

    await expect(generateCapsule({ userId: "user-1" })).rejects.toThrow();
  });
});
