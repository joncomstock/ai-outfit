import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { OutfitsPageClient } from "./client";

export const metadata: Metadata = {
  title: "Your Lookbook",
  description:
    "View your AI-generated outfits and curated looks from your wardrobe.",
};

export default async function OutfitsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const outfits = await db.select().from(outfitsTable).where(eq(outfitsTable.userId, userId)).orderBy(desc(outfitsTable.createdAt));

  const outfitsWithSlots = await Promise.all(
    outfits.map(async (outfit) => {
      const slots = await db
        .select({ slotType: outfitSlotsTable.slotType, itemImageUrl: closetItemsTable.imageUrl, itemSubCategory: closetItemsTable.subCategory })
        .from(outfitSlotsTable)
        .leftJoin(closetItemsTable, eq(outfitSlotsTable.closetItemId, closetItemsTable.id))
        .where(eq(outfitSlotsTable.outfitId, outfit.id));
      return { ...outfit, slots };
    })
  );

  const closetItems = await db.select().from(closetItemsTable).where(eq(closetItemsTable.userId, userId));

  return <OutfitsPageClient outfits={outfitsWithSlots} closetItems={closetItems} />;
}
