import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { affiliateClicksTable } from "@/db/schema/affiliate";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { productId, sourceContext } = body as {
    productId: string;
    sourceContext?: string;
  };

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await db.query.products.findFirst({
    where: eq(productsTable.id, productId),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await db.insert(affiliateClicksTable).values({
    userId: dbUserId,
    productId,
    sourceContext: sourceContext ?? null,
    affiliateUrl: product.affiliateUrl,
  });

  return NextResponse.json({ affiliateUrl: product.affiliateUrl });
}
