import { desc } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { AdminTrendsClient } from "./client";

export default async function AdminTrendsPage() {
  const trends = await db
    .select()
    .from(trendsTable)
    .orderBy(desc(trendsTable.updatedAt));

  return <AdminTrendsClient initialTrends={trends} />;
}
