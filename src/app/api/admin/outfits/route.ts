import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable } from "@/db/schema/outfits";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  const outfits = await db
    .select({
      id: outfitsTable.id,
      name: outfitsTable.name,
      generationMode: outfitsTable.generationMode,
      rating: outfitsTable.rating,
      shareToken: outfitsTable.shareToken,
      createdAt: outfitsTable.createdAt,
      userEmail: usersTable.email,
      userDisplayName: usersTable.displayName,
    })
    .from(outfitsTable)
    .leftJoin(usersTable, eq(outfitsTable.userId, usersTable.id))
    .orderBy(desc(outfitsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ outfits, page, limit });
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { outfitId } = body;

  if (!outfitId) return NextResponse.json({ error: "outfitId required" }, { status: 400 });

  await db.delete(outfitsTable).where(eq(outfitsTable.id, outfitId));

  return NextResponse.json({ deleted: true });
}
