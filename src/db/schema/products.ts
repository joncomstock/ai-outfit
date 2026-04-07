import {
  pgTable, uuid, text, integer, jsonb, pgEnum, timestamp,
} from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", [
  "tops", "bottoms", "outerwear", "shoes", "bags", "accessories",
]);

export const productsTable = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: productCategoryEnum("category").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  colors: jsonb("colors").$type<string[]>().default([]),
  sizes: jsonb("sizes").$type<string[]>().default([]),
  affiliateUrl: text("affiliate_url").notNull(),
  affiliateProvider: text("affiliate_provider"),
  sku: text("sku"),
  inStock: integer("in_stock").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
