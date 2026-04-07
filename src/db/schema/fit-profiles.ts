import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const fitProfilesTable = pgTable(
  "fit_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    heightCm: integer("height_cm"),
    weightKg: integer("weight_kg"),
    chestCm: integer("chest_cm"),
    waistCm: integer("waist_cm"),
    hipsCm: integer("hips_cm"),
    shouldersCm: integer("shoulders_cm"),
    inseamCm: integer("inseam_cm"),
    brandFitNotes: jsonb("brand_fit_notes")
      .$type<Record<string, string>>()
      .default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("fit_profile_user_unique").on(table.userId)]
);

export type FitProfile = typeof fitProfilesTable.$inferSelect;
export type NewFitProfile = typeof fitProfilesTable.$inferInsert;
