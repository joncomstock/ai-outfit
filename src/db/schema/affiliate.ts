import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const affiliateClicksTable = pgTable("affiliate_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  sourceContext: text("source_context"),
  affiliateUrl: text("affiliate_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AffiliateClick = typeof affiliateClicksTable.$inferSelect;
export type NewAffiliateClick = typeof affiliateClicksTable.$inferInsert;
