import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const outfit = await db.query.outfits.findFirst({
    where: and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)),
  });
  if (!outfit) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  const slots = await db
    .select({
      id: outfitSlotsTable.id,
      slotType: outfitSlotsTable.slotType,
      position: outfitSlotsTable.position,
      closetItemId: outfitSlotsTable.closetItemId,
      itemImageUrl: closetItemsTable.imageUrl,
      itemCategory: closetItemsTable.category,
      itemSubCategory: closetItemsTable.subCategory,
      itemColors: closetItemsTable.colors,
    })
    .from(outfitSlotsTable)
    .leftJoin(closetItemsTable, eq(outfitSlotsTable.closetItemId, closetItemsTable.id))
    .where(eq(outfitSlotsTable.outfitId, id));

  return NextResponse.json({ ...outfit, slots });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  await db.delete(outfitsTable).where(and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)));

  return NextResponse.json({ deleted: true });
}
