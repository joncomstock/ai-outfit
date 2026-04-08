import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getUsage } from "@/lib/billing/gates";
import { SubscriptionClient } from "./client";

export const metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, dbUserId),
  });
  if (!user) redirect("/sign-in");

  const usage = await getUsage(dbUserId);

  return (
    <SubscriptionClient
      subscriptionStatus={user.subscriptionStatus}
      stripeCustomerId={user.stripeCustomerId}
      usage={usage}
    />
  );
}
