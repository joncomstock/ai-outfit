import { productsTable } from "@/db/schema/products";
import { getTableName } from "drizzle-orm";

describe("Products schema", () => {
  it("products table has correct name", () => {
    expect(getTableName(productsTable)).toBe("products");
  });
});
