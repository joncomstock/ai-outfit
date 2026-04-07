import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { closetItemsTable } from "./closet-items";

export const generationModeEnum = pgEnum("generation_mode", [
  "for_you",
  "trend_based",
  "style_this",
]);

export const slotTypeEnum = pgEnum("slot_type", [
  "top",
  "bottom",
  "shoes",
  "outerwear",
  "accessory",
]);

export const outfitsTable = pgTable("outfits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  generationMode: generationModeEnum("generation_mode").notNull(),
  sourceItemId: uuid("source_item_id").references(() => closetItemsTable.id, {
    onDelete: "set null",
  }),
  rating: integer("rating"),
  feedback: text("feedback"),
  shareToken: text("share_token").unique(),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const outfitSlotsTable = pgTable("outfit_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  outfitId: uuid("outfit_id")
    .notNull()
    .references(() => outfitsTable.id, { onDelete: "cascade" }),
  slotType: slotTypeEnum("slot_type").notNull(),
  closetItemId: uuid("closet_item_id").references(() => closetItemsTable.id, {
    onDelete: "set null",
  }),
  position: integer("position").notNull().default(0),
});

export type Outfit = typeof outfitsTable.$inferSelect;
export type NewOutfit = typeof outfitsTable.$inferInsert;
export type OutfitSlot = typeof outfitSlotsTable.$inferSelect;
export type NewOutfitSlot = typeof outfitSlotsTable.$inferInsert;
