import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trendsTable } from "@/db/schema/trends";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, heroImageUrl, category, momentumScore, season, styleTags, status } = body;

  if (!name || !description || !heroImageUrl || !category) {
    return NextResponse.json({ error: "Missing required fields: name, description, heroImageUrl, category" }, { status: 400 });
  }

  const [trend] = await db
    .insert(trendsTable)
    .values({
      name,
      slug: slugify(name),
      description,
      heroImageUrl,
      category,
      momentumScore: momentumScore ?? 0,
      season: season ?? null,
      styleTags: styleTags ?? [],
      status: status ?? "draft",
    })
    .returning();

  return NextResponse.json(trend, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowedFields = [
    "name", "description", "heroImageUrl", "category",
    "momentumScore", "season", "styleTags", "status",
  ] as const;

  const safeUpdates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      safeUpdates[field] = body[field];
    }
  }

  if (safeUpdates.name) {
    safeUpdates.slug = slugify(safeUpdates.name as string);
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(trendsTable)
    .set(safeUpdates)
    .where(eq(trendsTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(trendsTable).where(eq(trendsTable.id, id));

  return NextResponse.json({ deleted: true });
}
