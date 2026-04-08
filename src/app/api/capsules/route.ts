import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable } from "@/db/schema/capsules";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const capsules = await db
    .select()
    .from(capsulesTable)
    .where(eq(capsulesTable.userId, dbUserId))
    .orderBy(desc(capsulesTable.createdAt));

  return NextResponse.json({ capsules });
}
