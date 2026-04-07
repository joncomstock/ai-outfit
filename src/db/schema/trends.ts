import {
  pgTable, uuid, text, integer, jsonb, pgEnum, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const trendStatusEnum = pgEnum("trend_status", ["draft", "published", "archived"]);
export const trendCategoryEnum = pgEnum("trend_category", ["luxury", "streetwear", "minimalism", "avant_garde", "classic"]);

export const trendsTable = pgTable("trends", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  category: trendCategoryEnum("category").notNull(),
  status: trendStatusEnum("status").notNull().default("draft"),
  momentumScore: integer("momentum_score").notNull().default(0),
  season: text("season"),
  styleTags: jsonb("style_tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const trendProductsTable = pgTable("trend_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  trendId: uuid("trend_id").notNull().references(() => trendsTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
}, (table) => [
  uniqueIndex("trend_product_unique").on(table.trendId, table.productId),
]);

export const savedTrendsTable = pgTable("saved_trends", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  trendId: uuid("trend_id").notNull().references(() => trendsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("saved_trend_unique").on(table.userId, table.trendId),
]);

export type Trend = typeof trendsTable.$inferSelect;
export type NewTrend = typeof trendsTable.$inferInsert;
export type TrendProduct = typeof trendProductsTable.$inferSelect;
export type SavedTrend = typeof savedTrendsTable.$inferSelect;
