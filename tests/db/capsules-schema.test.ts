import { describe, it, expect } from "vitest";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";

describe("capsules schema", () => {
  it("capsulesTable has expected columns", () => {
    const columns = Object.keys(capsulesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("name");
    expect(columns).toContain("description");
    expect(columns).toContain("season");
    expect(columns).toContain("theme");
    expect(columns).toContain("pieces");
    expect(columns).toContain("gapAnalysis");
    expect(columns).toContain("aiRawResponse");
    expect(columns).toContain("createdAt");
  });

  it("capsuleOutfitsTable has expected columns", () => {
    const columns = Object.keys(capsuleOutfitsTable);
    expect(columns).toContain("id");
    expect(columns).toContain("capsuleId");
    expect(columns).toContain("outfitId");
    expect(columns).toContain("position");
  });
});
