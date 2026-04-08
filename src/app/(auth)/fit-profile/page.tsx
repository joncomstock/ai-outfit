import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fitProfilesTable } from "@/db/schema/fit-profiles";
import { ensureUser } from "@/lib/auth/ensure-user";
import { FitProfileClient } from "./client";

export default async function FitProfilePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const profile = await db.query.fitProfiles.findFirst({
    where: eq(fitProfilesTable.userId, userId),
  });

  return (
    <FitProfileClient
      profile={
        profile
          ? { ...profile, brandFitNotes: profile.brandFitNotes ?? {} }
          : {
              heightCm: null,
              weightKg: null,
              chestCm: null,
              waistCm: null,
              hipsCm: null,
              shouldersCm: null,
              inseamCm: null,
              brandFitNotes: {},
            }
      }
    />
  );
}
