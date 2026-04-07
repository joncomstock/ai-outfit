import { sendOutfitReadyEmail, sendTrendAlertEmail } from "@/lib/email/resend";

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: "email-123" }),
    };
  },
}));

describe("sendOutfitReadyEmail", () => {
  it("sends outfit ready email", async () => {
    const result = await sendOutfitReadyEmail({
      to: "user@test.com",
      outfitName: "Spring Look",
      outfitUrl: "http://localhost:3000/outfits/outfit-1",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("sendTrendAlertEmail", () => {
  it("sends trend alert email", async () => {
    const result = await sendTrendAlertEmail({
      to: "user@test.com",
      trendName: "Quiet Luxury",
      trendUrl: "http://localhost:3000/trends/trend-1",
    });
    expect(result).toEqual({ success: true });
  });
});
