import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { outfitsTable } from "./outfits";

export const capsulesTable = pgTable("capsules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  season: text("season"),
  theme: text("theme"),
  pieces: jsonb("pieces").$type<string[]>().default([]),
  gapAnalysis: jsonb("gap_analysis")
    .$type<Array<{ category: string; description: string; searchQuery: string }>>()
    .default([]),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const capsuleOutfitsTable = pgTable(
  "capsule_outfits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    capsuleId: uuid("capsule_id")
      .notNull()
      .references(() => capsulesTable.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfitsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    uniqueIndex("capsule_outfit_unique").on(table.capsuleId, table.outfitId),
  ],
);

export type Capsule = typeof capsulesTable.$inferSelect;
export type NewCapsule = typeof capsulesTable.$inferInsert;
export type CapsuleOutfit = typeof capsuleOutfitsTable.$inferSelect;
export type NewCapsuleOutfit = typeof capsuleOutfitsTable.$inferInsert;
