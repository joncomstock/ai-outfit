import { PATCH, DELETE } from "@/app/api/closet/items/[id]/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));

vi.mock("@/db", () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "item-1", category: "tops", styleTags: ["updated"] },
          ]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "item-1" }]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: "db-user-uuid" }),
      },
    },
  },
}));

vi.mock("@/db/schema/users", () => ({
  usersTable: { clerkId: "clerk_id" },
}));

vi.mock("@/db/schema/closet-items", () => ({
  closetItemsTable: { id: "id", userId: "user_id" },
}));

describe("PATCH /api/closet/items/[id]", () => {
  it("updates item attributes", async () => {
    const req = new NextRequest("http://localhost/api/closet/items/item-1", {
      method: "PATCH",
      body: JSON.stringify({ styleTags: ["updated"] }),
      headers: { "Content-Type": "application/json" },
    });
    const params = Promise.resolve({ id: "item-1" });

    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/closet/items/[id]", () => {
  it("deletes an item", async () => {
    const req = new NextRequest("http://localhost/api/closet/items/item-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "item-1" });

    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
  });
});
