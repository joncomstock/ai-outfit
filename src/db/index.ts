import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./schema/users";
import { closetItemsTable } from "./schema/closet-items";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: { users: usersTable, closetItems: closetItemsTable },
});
