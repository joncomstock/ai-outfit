import { GET } from "@/app/api/shared/outfits/[token]/route";
import { NextRequest } from "next/server";

vi.mock("@/db", () => ({
  db: {
    query: {
      outfits: {
        findFirst: vi.fn().mockResolvedValue({
          id: "outfit-1",
          name: "Spring Look",
          shareToken: "abcdef1234567890abcdef1234567890",
          generationMode: "for_you",
          createdAt: new Date().toISOString(),
        }),
      },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "slot-1",
              slotType: "top",
              position: 0,
              closetItemId: "item-1",
              itemImageUrl: "https://example.com/top.jpg",
              itemCategory: "tops",
              itemSubCategory: "t-shirt",
              itemColors: ["white"],
            },
          ]),
        }),
      }),
    }),
  },
}));
vi.mock("@/db/schema/outfits", () => ({
  outfitsTable: { id: "id", shareToken: "share_token" },
  outfitSlotsTable: {
    id: "id",
    outfitId: "outfit_id",
    slotType: "slot_type",
    position: "position",
    closetItemId: "closet_item_id",
  },
}));
vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: {
    id: "id",
    imageUrl: "image_url",
    category: "category",
    subCategory: "sub_category",
    colors: "colors",
  },
}));

describe("GET /api/shared/outfits/[token]", () => {
  it("returns outfit data without auth", async () => {
    const req = new NextRequest("http://localhost/api/shared/outfits/abcdef1234567890abcdef1234567890");
    const params = Promise.resolve({ token: "abcdef1234567890abcdef1234567890" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Spring Look");
    expect(body.slots).toHaveLength(1);
  });
});
