import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { OutfitDetailClient } from "./client";
import { notFound } from "next/navigation";

export default async function OutfitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const { id } = await params;
  const outfit = await db.query.outfits.findFirst({
    where: and(eq(outfitsTable.id, id), eq(outfitsTable.userId, userId)),
  });
  if (!outfit) notFound();

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

  return <OutfitDetailClient outfit={outfit} slots={slots} />;
}
