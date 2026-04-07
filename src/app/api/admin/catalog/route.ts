import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, brand, category, price, imageUrl, affiliateUrl, description, colors, sizes, sku, currency } = body;

  if (!name || !brand || !category || !price || !imageUrl || !affiliateUrl) {
    return NextResponse.json(
      { error: "Missing required fields: name, brand, category, price, imageUrl, affiliateUrl" },
      { status: 400 }
    );
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name,
      brand,
      category,
      price,
      imageUrl,
      affiliateUrl,
      description: description ?? null,
      colors: colors ?? [],
      sizes: sizes ?? [],
      sku: sku ?? null,
      currency: currency ?? "USD",
    })
    .returning();

  return NextResponse.json(product, { status: 201 });
}
