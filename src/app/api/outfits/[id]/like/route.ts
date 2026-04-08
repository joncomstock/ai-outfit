import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { likesTable } from "@/db/schema/likes";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

async function verifyOutfitAccess(outfitId: string, dbUserId: string) {
  const outfit = await db.query.outfits.findFirst({
    where: eq(outfitsTable.id, outfitId),
  });

  if (!outfit) {
    return { allowed: false as const, response: NextResponse.json({ error: "Outfit not found" }, { status: 404 }) };
  }

  // Only allow likes on shared (public) outfits or the user's own outfits
  if (!outfit.shareToken && outfit.userId !== dbUserId) {
    return { allowed: false as const, response: NextResponse.json({ error: "Outfit not found" }, { status: 404 }) };
  }

  return { allowed: true as const };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: outfitId } = await params;

  const access = await verifyOutfitAccess(outfitId, dbUserId);
  if (!access.allowed) return access.response;

  await db
    .insert(likesTable)
    .values({ userId: dbUserId, outfitId })
    .onConflictDoNothing()
    .returning();

  // Return updated like count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.outfitId, outfitId));

  return NextResponse.json({ liked: true, likeCount: count }, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id: outfitId } = await params;

  const access = await verifyOutfitAccess(outfitId, dbUserId);
  if (!access.allowed) return access.response;

  await db
    .delete(likesTable)
    .where(
      and(
        eq(likesTable.userId, dbUserId),
        eq(likesTable.outfitId, outfitId),
      ),
    );

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(likesTable)
    .where(eq(likesTable.outfitId, outfitId));

  return NextResponse.json({ unliked: true, likeCount: count });
}
