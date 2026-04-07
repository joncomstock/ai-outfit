import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { productsTable } from "@/db/schema/products";
import { ensureUser } from "@/lib/auth/ensure-user";
import { parseCsv } from "@/lib/admin/csv-import";

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const csvText = await file.text();

  let products;
  try {
    products = parseCsv(csvText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid CSV";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (products.length === 0) {
    return NextResponse.json({ error: "No valid products found in CSV" }, { status: 400 });
  }

  const inserted = await db.insert(productsTable).values(products).returning();

  return NextResponse.json({ imported: inserted.length }, { status: 201 });
}
