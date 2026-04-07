import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const outfits = await db
    .select()
    .from(outfitsTable)
    .where(eq(outfitsTable.userId, dbUserId))
    .orderBy(desc(outfitsTable.createdAt));

  return NextResponse.json(outfits);
}
