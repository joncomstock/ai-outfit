import {
  pgTable,
  uuid,
  text,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const itemStatusEnum = pgEnum("item_status", [
  "processing",
  "ready",
  "error",
]);

export const fitEnum = pgEnum("fit", [
  "slim",
  "regular",
  "relaxed",
  "oversized",
]);

export const closetItemsTable = pgTable("closet_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sourceUrl: text("source_url"),
  status: itemStatusEnum("status").notNull().default("processing"),
  category: text("category"),
  subCategory: text("sub_category"),
  colors: jsonb("colors").$type<string[]>().default([]),
  fit: fitEnum("fit"),
  seasonality: jsonb("seasonality").$type<string[]>().default([]),
  styleTags: jsonb("style_tags").$type<string[]>().default([]),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ClosetItem = typeof closetItemsTable.$inferSelect;
export type NewClosetItem = typeof closetItemsTable.$inferInsert;
