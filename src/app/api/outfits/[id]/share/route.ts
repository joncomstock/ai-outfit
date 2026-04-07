import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";
import { generateShareToken } from "@/lib/sharing/generate-token";

export async function POST(
  req: NextRequest,
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

  // Return existing token if already shared
  if (outfit.shareToken) {
    const shareUrl = `${req.nextUrl.origin}/shared/outfits/${outfit.shareToken}`;
    return NextResponse.json({ shareToken: outfit.shareToken, shareUrl });
  }

  const token = generateShareToken();

  const [updated] = await db
    .update(outfitsTable)
    .set({ shareToken: token })
    .where(and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });

  const shareUrl = `${req.nextUrl.origin}/shared/outfits/${token}`;
  return NextResponse.json({ shareToken: token, shareUrl });
}
