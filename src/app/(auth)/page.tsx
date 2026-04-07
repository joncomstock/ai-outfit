import { auth } from "@clerk/nextjs/server";
import { eq, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { outfitsTable } from "@/db/schema/outfits";
import { ensureUser } from "@/lib/auth/ensure-user";
import { Button } from "@/components/ui/button";
import { ClosetItemCard } from "@/components/closet/closet-item-card";
import Link from "next/link";

export default async function Dashboard() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const userId = await ensureUser(clerkId);
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) return null;

  const recentItems = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, user.id))
    .orderBy(desc(closetItemsTable.createdAt))
    .limit(4);

  const [itemCountResult] = await db
    .select({ value: count() })
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, user.id));

  const itemCount = itemCountResult?.value ?? 0;

  const [outfitCountResult] = await db
    .select({ value: count() })
    .from(outfitsTable)
    .where(eq(outfitsTable.userId, user.id));

  const outfitCount = outfitCountResult?.value ?? 0;

  const hasItems = recentItems.length > 0;

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 mb-16">
        <div className="flex flex-col justify-center">
          <span className="label-text text-on-surface-variant tracking-widest mb-6">
            STYLE INTELLIGENCE
          </span>
          <h1 className="font-serif text-display-md text-on-surface leading-tight mb-6">
            Your Personal
            <br />
            <span className="italic text-primary">AI Stylist</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-lg mb-10">
            Outfit Engine analyzes your wardrobe, understands your style, and
            curates looks tailored to you. Upload your pieces and let
            intelligence do the rest.
          </p>
          <div>
            <Link href="/closet">
              <Button>START YOUR STYLE JOURNEY</Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="aspect-[3/4] w-full bg-surface-container-low" />
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-3 gap-8 py-12 mb-16 border-t border-b border-outline-variant">
        {[
          { value: itemCount, label: "Items" },
          { value: outfitCount, label: "Outfits" },
          { value: 0, label: "Looks" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-serif text-display-sm text-on-surface">
              {stat.value}
            </p>
            <span className="label-text text-on-surface-variant tracking-widest">
              {stat.label.toUpperCase()}
            </span>
          </div>
        ))}
      </section>

      {/* ── Recently Added ── */}
      {hasItems && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
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

      {/* ── Featured Curation (Coming Soon) ── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-headline-md text-on-surface">
            Featured Curation
          </h2>
          <span className="label-text text-on-surface-variant tracking-widest">
            COMING IN PHASE 2
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          <div className="aspect-[4/5] bg-surface-container-low flex items-end p-6">
            <p className="font-serif text-headline-md text-on-surface-variant">
              Curated looks from your wardrobe
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-surface-container-low"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Styles (Coming Soon) ── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-headline-md text-on-surface">
            Trending Styles
          </h2>
          <span className="label-text text-on-surface-variant tracking-widest">
            COMING IN PHASE 2
          </span>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {["Quiet Luxury", "Coastal Grandmother", "Dark Academia", "Old Money"].map(
            (trend) => (
              <div key={trend} className="flex-shrink-0 w-56">
                <div className="aspect-[3/4] bg-surface-container-low mb-3" />
                <p className="font-serif text-body-lg text-on-surface">
                  {trend}
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
