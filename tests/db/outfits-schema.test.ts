import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { getTableName } from "drizzle-orm";

describe("Outfits schema", () => {
  it("outfits table has correct name", () => {
    expect(getTableName(outfitsTable)).toBe("outfits");
  });

  it("outfit_slots table has correct name", () => {
    expect(getTableName(outfitSlotsTable)).toBe("outfit_slots");
  });
});
