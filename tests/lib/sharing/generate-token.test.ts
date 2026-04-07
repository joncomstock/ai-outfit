import { generateShareToken } from "@/lib/sharing/generate-token";

describe("generateShareToken", () => {
  it("returns a 32-character hex string", () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateShareToken()));
    expect(tokens.size).toBe(100);
  });
});
