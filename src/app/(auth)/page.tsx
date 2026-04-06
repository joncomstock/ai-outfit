import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClosetItemCard } from "@/components/closet/closet-item-card";
import Link from "next/link";

export default async function Dashboard() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!user) return null;

  const recentItems = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, user.id))
    .orderBy(desc(closetItemsTable.createdAt))
    .limit(4);

  const isNewUser = user.onboardingState === "signup";
  const hasItems = recentItems.length > 0;

  return (
    <div>
      <section className="py-12 mb-12">
        <h1 className="font-serif text-display-md text-on-surface mb-4">
          {isNewUser
            ? "Welcome to Outfit Engine"
            : `Welcome back, ${user.displayName || "there"}`}
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-8">
          {isNewUser
            ? "Your AI stylist is ready. Start by uploading items from your closet and we'll analyze each piece to build your style profile."
            : "Your AI stylist is ready to create something new."}
        </p>
        <div className="flex gap-4">
          <Link href="/closet">
            <Button>{isNewUser ? "Upload Your First Item" : "Go to Closet"}</Button>
          </Link>
        </div>
      </section>

      {hasItems && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-headline-md text-on-surface">
              Recently Added
            </h2>
            <Link href="/closet">
              <Button variant="tertiary">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentItems.map((item) => (
              <ClosetItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {!hasItems && !isNewUser && (
        <Card className="p-10 text-center">
          <p className="font-serif text-headline-sm text-on-surface mb-2">
            Your closet is waiting
          </p>
          <p className="text-body-lg text-on-surface-variant mb-6">
            Upload clothing photos to get started with personalized outfit recommendations.
          </p>
          <Link href="/closet">
            <Button>Start Adding Items</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
