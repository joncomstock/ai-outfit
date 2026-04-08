import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { ensureUser } from "@/lib/auth/ensure-user";
import { CapsuleDetailClient } from "./client";

export const metadata = { title: "Capsule Detail" };

export default async function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const { id } = await params;

  const capsule = await db.query.capsules.findFirst({
    where: and(eq(capsulesTable.id, id), eq(capsulesTable.userId, dbUserId)),
  });

  if (!capsule) redirect("/capsules");

  // Fetch linked outfits with their slots
  const linkedOutfits = await db
    .select({
      outfitId: capsuleOutfitsTable.outfitId,
      outfitName: outfitsTable.name,
      position: capsuleOutfitsTable.position,
    })
    .from(capsuleOutfitsTable)
    .innerJoin(outfitsTable, eq(capsuleOutfitsTable.outfitId, outfitsTable.id))
    .where(eq(capsuleOutfitsTable.capsuleId, id))
    .orderBy(capsuleOutfitsTable.position);

  // Fetch closet items for the pieces
  const pieceItems = capsule.pieces?.length
    ? await db
        .select()
        .from(closetItemsTable)
        .where(eq(closetItemsTable.userId, dbUserId))
    : [];

  const pieces = pieceItems.filter((item) =>
    capsule.pieces?.includes(item.id),
  );

  return (
    <CapsuleDetailClient
      capsule={capsule}
      pieces={pieces}
      outfits={linkedOutfits}
    />
  );
}
