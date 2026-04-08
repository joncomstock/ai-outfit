import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./schema/users";
import { closetItemsTable } from "./schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "./schema/outfits";
import { productsTable } from "./schema/products";
import { trendsTable, trendProductsTable, savedTrendsTable } from "./schema/trends";
import { affiliateClicksTable } from "./schema/affiliate";
import { notificationsTable } from "./schema/notifications";
import { fitProfilesTable } from "./schema/fit-profiles";
import { capsulesTable, capsuleOutfitsTable } from "./schema/capsules";
import { followsTable } from "./schema/follows";
import { activitiesTable } from "./schema/activities";
import { likesTable } from "./schema/likes";

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
    notifications: notificationsTable,
    fitProfiles: fitProfilesTable,
    capsules: capsulesTable,
    capsuleOutfits: capsuleOutfitsTable,
    follows: followsTable,
    activities: activitiesTable,
    likes: likesTable,
  },
});
