import { GET } from "@/app/api/jobs/[id]/status/route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));

vi.mock("@/lib/jobs/job-store", () => ({
  getJob: vi.fn().mockResolvedValue({
    id: "job-123",
    itemId: "item-456",
    status: "analyzing",
    error: null,
    outfitId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  subscribeToJob: vi.fn().mockReturnValue(() => {}),
}));

describe("GET /api/jobs/[id]/status", () => {
  it("returns a streaming response", async () => {
    const req = new NextRequest(
      "http://localhost/api/jobs/job-123/status"
    );
    const params = Promise.resolve({ id: "job-123" });

    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("returns 404 for unknown job", async () => {
    const { getJob } = await import("@/lib/jobs/job-store");
    vi.mocked(getJob).mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost/api/jobs/unknown/status"
    );
    const params = Promise.resolve({ id: "unknown" });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });
});
