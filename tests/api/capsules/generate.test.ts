import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/capsules/generate/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/lib/jobs/job-store", () => ({
  createJob: vi.fn().mockReturnValue("job-123"),
  updateJobStatus: vi.fn(),
}));
vi.mock("@/lib/billing/gates", () => ({
  isPremium: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/ai/generate-capsule", () => ({
  generateCapsule: vi.fn().mockResolvedValue({
    name: "Test Capsule",
    selectedItems: ["item-1"],
    outfitCombinations: [],
    gaps: [],
  }),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "capsule-1" }]),
      }),
    }),
  },
}));
vi.mock("@/db/schema/capsules", () => ({
  capsulesTable: {},
  capsuleOutfitsTable: {},
}));

describe("POST /api/capsules/generate", () => {
  it("starts capsule generation and returns jobId", async () => {
    const req = new NextRequest("http://localhost/api/capsules/generate", {
      method: "POST",
      body: JSON.stringify({ season: "spring" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.jobId).toBe("job-123");
  });
});
