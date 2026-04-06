import {
  pgTable,
  uuid,
  text,
  jsonb,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

export const budgetRangeEnum = pgEnum("budget_range", [
  "budget",
  "mid",
  "luxury",
]);

export const onboardingStateEnum = pgEnum("onboarding_state", [
  "signup",
  "first_upload",
  "first_processed",
  "first_outfit",
  "complete",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull().default(""),
  stylePreferences: jsonb("style_preferences").$type<string[]>().default([]),
  sizes: jsonb("sizes")
    .$type<Record<string, string>>()
    .default({}),
  budgetRange: budgetRangeEnum("budget_range").default("mid"),
  onboardingState: onboardingStateEnum("onboarding_state")
    .notNull()
    .default("signup"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
