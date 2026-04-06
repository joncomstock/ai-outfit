import { POST, GET } from "@/app/api/closet/items/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));

vi.mock("@/db", () => {
  const mockReturning = vi.fn().mockResolvedValue([
    { id: "item-uuid-1", status: "processing" },
  ]);
  return {
    db: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: mockReturning,
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue({ id: "db-user-uuid" }),
        },
      },
    },
  };
});

vi.mock("@/db/schema/users", () => ({
  usersTable: { clerkId: "clerk_id" },
}));

vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: "closet_items_mock",
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({
    url: "https://blob.vercel-storage.com/test.jpg",
  }),
}));

vi.mock("@/lib/ai/analyze-clothing", () => ({
  analyzeClothingImage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/jobs/job-store", () => ({
  createJob: vi.fn().mockReturnValue("job-uuid-1"),
}));

describe("POST /api/closet/items", () => {
  it("uploads an image and creates a closet item", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new Blob(["fake image data"], { type: "image/jpeg" }),
      "shirt.jpg"
    );

    const req = new NextRequest("http://localhost/api/closet/items", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("jobId");
  });
});
