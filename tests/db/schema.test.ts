import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { getTableName } from "drizzle-orm";

describe("Database schema", () => {
  it("users table has correct name", () => {
    expect(getTableName(usersTable)).toBe("users");
  });

  it("closet_items table has correct name", () => {
    expect(getTableName(closetItemsTable)).toBe("closet_items");
  });
});
