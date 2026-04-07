import { auth } from "@clerk/nextjs/server";
import { eq, and, desc, ne } from "drizzle-orm";
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

  const recentOutfitsRaw = await db
    .select()
    .from(outfitsTable)
    .where(and(eq(outfitsTable.userId, userId), ne(outfitsTable.id, id)))
    .orderBy(desc(outfitsTable.createdAt))
    .limit(4);

  const archiveOutfits = await Promise.all(
    recentOutfitsRaw.map(async (o) => {
      const oSlots = await db
        .select({
          slotType: outfitSlotsTable.slotType,
          itemImageUrl: closetItemsTable.imageUrl,
          itemSubCategory: closetItemsTable.subCategory,
        })
        .from(outfitSlotsTable)
        .leftJoin(closetItemsTable, eq(outfitSlotsTable.closetItemId, closetItemsTable.id))
        .where(eq(outfitSlotsTable.outfitId, o.id));
      return { ...o, slots: oSlots };
    })
  );

  return <OutfitDetailClient outfit={outfit} slots={slots} archiveOutfits={archiveOutfits} />;
}
