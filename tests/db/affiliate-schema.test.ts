import { affiliateClicksTable } from "@/db/schema/affiliate";
import { getTableName } from "drizzle-orm";

describe("Affiliate schema", () => {
  it("affiliate_clicks table has correct name", () => {
    expect(getTableName(affiliateClicksTable)).toBe("affiliate_clicks");
  });
});
