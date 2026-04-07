import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fitProfilesTable } from "@/db/schema/fit-profiles";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = await db.query.fitProfiles.findFirst({
    where: eq(fitProfilesTable.userId, dbUserId),
  });

  if (!profile) {
    return NextResponse.json({
      heightCm: null,
      weightKg: null,
      chestCm: null,
      waistCm: null,
      hipsCm: null,
      shouldersCm: null,
      inseamCm: null,
      brandFitNotes: {},
    });
  }

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  const measurements = {
    userId: dbUserId,
    heightCm: body.heightCm ?? null,
    weightKg: body.weightKg ?? null,
    chestCm: body.chestCm ?? null,
    waistCm: body.waistCm ?? null,
    hipsCm: body.hipsCm ?? null,
    shouldersCm: body.shouldersCm ?? null,
    inseamCm: body.inseamCm ?? null,
    brandFitNotes: body.brandFitNotes ?? {},
  };

  const [result] = await db
    .insert(fitProfilesTable)
    .values(measurements)
    .onConflictDoUpdate({
      target: fitProfilesTable.userId,
      set: measurements,
    })
    .returning();

  return NextResponse.json(result);
}
