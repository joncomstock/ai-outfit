import { describe, it, expect } from "vitest";
import { followsTable } from "@/db/schema/follows";

describe("follows schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(followsTable);
    expect(columns).toContain("id");
    expect(columns).toContain("followerId");
    expect(columns).toContain("followingId");
    expect(columns).toContain("createdAt");
  });
});
