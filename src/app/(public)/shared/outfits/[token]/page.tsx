import { eq } from "drizzle-orm";
import { db } from "@/db";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { closetItemsTable } from "@/db/schema/closet-items";
import { productsTable } from "@/db/schema/products";
import { OutfitSlot } from "@/components/outfits/outfit-slot";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface SharedOutfitPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharedOutfitPageProps): Promise<Metadata> {
  const { token } = await params;
  const outfit = await db.query.outfits.findFirst({
    where: eq(outfitsTable.shareToken, token),
  });
  return {
    title: outfit ? `${outfit.name || "Curated Outfit"} — Outfit Engine` : "Outfit Not Found",
    description: "A curated outfit created with Outfit Engine, your personal AI stylist.",
    openGraph: {
      title: outfit?.name || "Curated Outfit",
      description: "Created with Outfit Engine — AI-powered personal styling.",
      type: "article",
    },
  };
}

export default async function SharedOutfitPage({ params }: SharedOutfitPageProps) {
  const { token } = await params;

  const outfit = await db.query.outfits.findFirst({
    where: eq(outfitsTable.shareToken, token),
  });
  if (!outfit) notFound();

  const slots = await db
    .select({
      id: outfitSlotsTable.id,
      slotType: outfitSlotsTable.slotType,
      position: outfitSlotsTable.position,
      closetItemId: outfitSlotsTable.closetItemId,
      itemImageUrl: closetItemsTable.imageUrl,
      itemCategory: closetItemsTable.category,
      itemSubCategory: closetItemsTable.subCategory,
      itemColors: closetItemsTable.colors,
    })
    .from(outfitSlotsTable)
    .leftJoin(closetItemsTable, eq(outfitSlotsTable.closetItemId, closetItemsTable.id))
    .where(eq(outfitSlotsTable.outfitId, outfit.id));

  // Fetch suggested products for "Shop Now" affiliate links
  const suggestedProducts = await db
    .select()
    .from(productsTable)
    .limit(4);

  const slotOrder = ["top", "bottom", "shoes", "outerwear", "accessory"];
  const sortedSlots = [...slots].sort((a, b) => slotOrder.indexOf(a.slotType) - slotOrder.indexOf(b.slotType));
  const primarySlots = sortedSlots.filter((s) => s.slotType === "top" || s.slotType === "bottom");
  const secondarySlots = sortedSlots.filter((s) => s.slotType === "shoes" || s.slotType === "outerwear" || s.slotType === "accessory");

  const createdDate = new Date(outfit.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Minimal public header */}
      <header className="sticky top-0 z-30 glass border-b border-outline-variant/10">
        <nav className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
          <span className="font-serif text-title-lg text-on-surface">Outfit Engine</span>
          <Link href="/sign-up">
            <Button variant="secondary">Create Your Own</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Hero image */}
        {sortedSlots[0]?.itemImageUrl && (
          <div className="aspect-[16/9] relative overflow-hidden bg-surface-container-low mb-12">
            <img
              src={sortedSlots[0].itemImageUrl}
              alt={outfit.name || "Outfit hero"}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-on-surface/60 to-transparent p-8">
              <span className="label-text text-white/80 tracking-widest mb-2 block">
                CURATED OUTFIT — {createdDate.toUpperCase()}
              </span>
              <h1 className="font-serif text-display-sm text-white">
                {outfit.name || "Untitled Outfit"}
              </h1>
            </div>
          </div>
        )}

        {/* Editorial Note */}
        <section className="mb-16 max-w-2xl">
          <span className="label-text text-on-surface-variant tracking-widest mb-4 block">
            EDITORIAL NOTE
          </span>
          <h2 className="font-serif text-headline-lg text-on-surface mb-4">
            {outfit.name || "Untitled Outfit"}
          </h2>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            {typeof outfit.aiRawResponse === "object" &&
            outfit.aiRawResponse !== null &&
            "description" in outfit.aiRawResponse
              ? String((outfit.aiRawResponse as Record<string, unknown>).description)
              : "A carefully considered composition balancing silhouette, texture, and proportion. Each piece has been selected to create a cohesive narrative that moves effortlessly from context to context."}
          </p>
        </section>

        {/* Outfit Architecture */}
        <section className="mb-16">
          <span className="label-text text-on-surface-variant tracking-widest mb-6 block">
            OUTFIT ARCHITECTURE
          </span>

          {/* Primary slots (top + bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {primarySlots.map((slot) => (
              <OutfitSlot
                key={slot.id}
                slotType={slot.slotType}
                imageUrl={slot.itemImageUrl}
                category={slot.itemCategory}
                subCategory={slot.itemSubCategory}
              />
            ))}
          </div>

          {/* Secondary slots */}
          {secondarySlots.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {secondarySlots.map((slot) => (
                <OutfitSlot
                  key={slot.id}
                  slotType={slot.slotType}
                  imageUrl={slot.itemImageUrl}
                  category={slot.itemCategory}
                  subCategory={slot.itemSubCategory}
                />
              ))}
            </div>
          )}
        </section>

        {/* Shop Now — affiliate links */}
        {suggestedProducts.length > 0 && (
          <section className="py-12 border-t border-outline-variant/10">
            <h2 className="font-serif text-headline-sm text-on-surface mb-2">
              Shop the Look
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Get similar pieces from our curated selection.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {suggestedProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/api/affiliate/click?productId=${product.id}&source=shared_outfit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low mb-3">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <p className="font-serif text-body-lg text-on-surface">{product.name}</p>
                  <p className="label-text text-on-surface-variant text-label-md mt-0.5">
                    {product.brand} — ${(product.price / 100).toFixed(0)}
                  </p>
                  <span className="inline-block mt-2 label-text text-primary underline underline-offset-4 decoration-1 text-label-md">
                    SHOP NOW
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 text-center border-t border-outline-variant/10">
          <h2 className="font-serif text-headline-md text-on-surface mb-4">
            Your Wardrobe, Intelligently Styled
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto mb-8">
            Outfit Engine uses AI to analyze your closet and create personalized outfits. Start your style journey today.
          </p>
          <Link href="/sign-up">
            <Button>GET STARTED FREE</Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
