import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const capsule = await db.query.capsules.findFirst({
    where: and(eq(capsulesTable.id, id), eq(capsulesTable.userId, dbUserId)),
  });

  if (!capsule) {
    return NextResponse.json({ error: "Capsule not found" }, { status: 404 });
  }

  // Fetch linked outfits
  const outfits = await db
    .select({
      outfitId: capsuleOutfitsTable.outfitId,
      outfitName: outfitsTable.name,
      position: capsuleOutfitsTable.position,
    })
    .from(capsuleOutfitsTable)
    .innerJoin(outfitsTable, eq(capsuleOutfitsTable.outfitId, outfitsTable.id))
    .where(eq(capsuleOutfitsTable.capsuleId, id))
    .orderBy(capsuleOutfitsTable.position);

  return NextResponse.json({
    ...capsule,
    outfits,
  });
}
