import {
  pgTable,
  uuid,
  text,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const activityTypeEnum = pgEnum("activity_type", [
  "shared_outfit",
  "new_capsule",
]);

export const activitiesTable = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  referenceId: uuid("reference_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;
