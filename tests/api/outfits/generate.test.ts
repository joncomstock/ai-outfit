import { POST } from "@/app/api/outfits/generate/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
vi.mock("@/lib/auth/ensure-user", () => ({
  ensureUser: vi.fn().mockResolvedValue("db-user-uuid"),
}));
vi.mock("@/lib/jobs/job-store", () => ({
  createJob: vi.fn().mockReturnValue("job-uuid-1"),
}));
vi.mock("@/lib/ai/generate-outfit", () => ({
  generateOutfit: vi.fn().mockResolvedValue("outfit-uuid-1"),
}));
vi.mock("@/lib/billing/gates", () => ({
  canGenerate: vi.fn().mockResolvedValue(true),
  recordUsage: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/outfits/generate", () => {
  it("triggers generation and returns job ID", async () => {
    const req = new NextRequest("http://localhost/api/outfits/generate", {
      method: "POST",
      body: JSON.stringify({ mode: "for_you" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body).toHaveProperty("jobId", "job-uuid-1");
  });
});
