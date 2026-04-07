import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const rating = body.rating as number | undefined;
  const feedback = body.feedback as string | undefined;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) updates.rating = rating;
  if (feedback !== undefined) updates.feedback = feedback;

  const [updated] = await db
    .update(outfitsTable)
    .set(updates)
    .where(and(eq(outfitsTable.id, id), eq(outfitsTable.userId, dbUserId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });

  return NextResponse.json(updated);
}
