import { fitProfilesTable } from "@/db/schema/fit-profiles";
import { getTableName } from "drizzle-orm";

describe("Fit profiles schema", () => {
  it("fit_profiles table has correct name", () => {
    expect(getTableName(fitProfilesTable)).toBe("fit_profiles");
  });
});
