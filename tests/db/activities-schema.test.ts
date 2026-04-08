import { describe, it, expect } from "vitest";
import { activitiesTable } from "@/db/schema/activities";

describe("activities schema", () => {
  it("has expected columns", () => {
    const columns = Object.keys(activitiesTable);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("type");
    expect(columns).toContain("referenceId");
    expect(columns).toContain("metadata");
    expect(columns).toContain("createdAt");
  });
});
