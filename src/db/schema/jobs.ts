import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "uploading",
  "analyzing",
  "detecting_colors",
  "detecting_fit",
  "generating",
  "ready",
  "error",
]);

export const jobsTable = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: text("item_id"),
  outfitId: text("outfit_id"),
  status: jobStatusEnum("status").notNull().default("queued"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;
