import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const outfit = await db.query.outfits.findFirst({
    where: eq(outfitsTable.shareToken, token),
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
    .where(eq(outfitSlotsTable.outfitId, outfit.id));

  return NextResponse.json({
    name: outfit.name,
    generationMode: outfit.generationMode,
    createdAt: outfit.createdAt,
    slots,
  });
}
