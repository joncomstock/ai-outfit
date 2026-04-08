import { describe, it, expect } from "vitest";
import { likesTable } from "@/db/schema/likes";

describe("likes schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(likesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("outfitId");
    expect(columns).toContain("createdAt");
  });
});
