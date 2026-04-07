import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./schema/users";
import { closetItemsTable } from "./schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "./schema/outfits";
import { productsTable } from "./schema/products";
import { trendsTable, trendProductsTable, savedTrendsTable } from "./schema/trends";
import { affiliateClicksTable } from "./schema/affiliate";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: {
    users: usersTable,
    closetItems: closetItemsTable,
    outfits: outfitsTable,
    outfitSlots: outfitSlotsTable,
    products: productsTable,
    trends: trendsTable,
    trendProducts: trendProductsTable,
    savedTrends: savedTrendsTable,
    affiliateClicks: affiliateClicksTable,
  },
});
