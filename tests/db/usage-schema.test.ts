import { describe, it, expect } from "vitest";
import { usageTrackingTable } from "@/db/schema/usage";

describe("usage_tracking schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(usageTrackingTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("action");
    expect(columns).toContain("month");
    expect(columns).toContain("count");
  });
});
