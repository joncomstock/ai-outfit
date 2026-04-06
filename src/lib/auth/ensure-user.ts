import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";

/**
 * Ensures the authenticated Clerk user exists in our database.
 * If the webhook hasn't fired yet, auto-provisions from Clerk data.
 * Returns the internal user ID, or null if not authenticated.
 */
export async function ensureUser(clerkId: string): Promise<string | null> {
  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (existing) return existing.id;

  // User doesn't exist — auto-provision from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const displayName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  const [user] = await db
    .insert(usersTable)
    .values({
      clerkId,
      email,
      displayName,
    })
    .onConflictDoNothing()
    .returning();

  // If onConflictDoNothing triggered (race condition), re-fetch
  if (!user) {
    const refetched = await db.query.users.findFirst({
      where: eq(usersTable.clerkId, clerkId),
    });
    return refetched?.id ?? null;
  }

  return user.id;
}
