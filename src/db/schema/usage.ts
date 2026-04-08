import {
  pgTable,
  uuid,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const usageTrackingTable = pgTable(
  "usage_tracking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    month: text("month").notNull(), // Format: "2026-04"
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("usage_unique").on(table.userId, table.action, table.month),
  ],
);

export type UsageTracking = typeof usageTrackingTable.$inferSelect;
export type NewUsageTracking = typeof usageTrackingTable.$inferInsert;
