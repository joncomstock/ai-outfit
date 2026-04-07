import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notificationsTable } from "@/db/schema/notifications";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, dbUserId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { id, markAllRead } = body;

  if (markAllRead) {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, dbUserId),
          isNull(notificationsTable.readAt)
        )
      );
    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Notification id required" }, { status: 400 });
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, dbUserId)
      )
    )
    .returning();

  if (!updated) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  return NextResponse.json(updated);
}
