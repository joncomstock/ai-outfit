import { trendsTable, trendProductsTable, savedTrendsTable } from "@/db/schema/trends";
import { getTableName } from "drizzle-orm";

describe("Trends schema", () => {
  it("trends table has correct name", () => {
    expect(getTableName(trendsTable)).toBe("trends");
  });
  it("trend_products table has correct name", () => {
    expect(getTableName(trendProductsTable)).toBe("trend_products");
  });
  it("saved_trends table has correct name", () => {
    expect(getTableName(savedTrendsTable)).toBe("saved_trends");
  });
});
