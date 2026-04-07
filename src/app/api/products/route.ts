import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24", 10), 48);
  const offset = (page - 1) * limit;

  const conditions = [eq(productsTable.inStock, 1)];
  if (category) conditions.push(eq(productsTable.category, category as any));
  if (brand) conditions.push(eq(productsTable.brand, brand));

  const orderBy =
    sort === "price_asc"
      ? productsTable.price
      : sort === "price_desc"
        ? desc(productsTable.price)
        : desc(productsTable.createdAt);

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ products, page, limit });
}
