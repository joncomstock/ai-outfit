import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { uploadClothingImage } from "@/lib/storage/upload";
import { analyzeClothingImage } from "@/lib/ai/analyze-clothing";
import { createJob } from "@/lib/jobs/job-store";

async function getUserId(clerkId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  return user?.id ?? null;
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await getUserId(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const image = formData.get("image") as File | null;
  const sourceUrl = formData.get("sourceUrl") as string | null;

  if (!image && !sourceUrl) {
    return NextResponse.json(
      { error: "Image file or source URL required" },
      { status: 400 }
    );
  }

  let imageUrl: string;
  if (image) {
    imageUrl = await uploadClothingImage(image, dbUserId);
  } else {
    imageUrl = sourceUrl!;
  }

  const [item] = await db
    .insert(closetItemsTable)
    .values({
      userId: dbUserId,
      imageUrl,
      sourceUrl,
      status: "processing",
    })
    .returning();

  const jobId = createJob(item.id);

  // Update onboarding state if this is the first upload
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, dbUserId),
  });
  if (user && user.onboardingState === "signup") {
    await db
      .update(usersTable)
      .set({ onboardingState: "first_upload" })
      .where(eq(usersTable.id, dbUserId));
  }

  // Fire and forget — analysis runs in the background
  analyzeClothingImage(item.id, imageUrl, jobId).catch(console.error);

  return NextResponse.json({ id: item.id, jobId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUserId = await getUserId(clerkId);
  if (!dbUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  const query = db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, dbUserId))
    .orderBy(desc(closetItemsTable.createdAt));

  const items = await query;

  const filtered = category
    ? items.filter((item) => item.category === category)
    : items;

  return NextResponse.json(filtered);
}
