import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable } from "@/db/schema/capsules";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CapsulesClient } from "./client";

export const metadata = { title: "Capsule Wardrobes" };

export default async function CapsulesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const capsules = await db
    .select()
    .from(capsulesTable)
    .where(eq(capsulesTable.userId, dbUserId))
    .orderBy(desc(capsulesTable.createdAt));

  return <CapsulesClient capsules={capsules} />;
}
