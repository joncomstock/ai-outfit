import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, dbUserId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    stylePreferences: user.stylePreferences,
    sizes: user.sizes,
    budgetRange: user.budgetRange,
    onboardingState: user.onboardingState,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  const allowedFields = ["displayName", "stylePreferences", "sizes", "budgetRange"] as const;
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, dbUserId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    stylePreferences: updated.stylePreferences,
    sizes: updated.sizes,
    budgetRange: updated.budgetRange,
    onboardingState: updated.onboardingState,
  });
}
