import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) return null;

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        stylePreferences: user.stylePreferences ?? [],
        sizes: user.sizes ?? {},
        budgetRange: user.budgetRange ?? "mid",
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
