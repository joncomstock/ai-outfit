"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OutfitSlot } from "@/components/outfits/outfit-slot";
import { OutfitRating } from "@/components/outfits/outfit-rating";
import { ShareButton } from "@/components/sharing/share-button";
import { useToast } from "@/components/ui/toast";
import type { Outfit } from "@/db/schema/outfits";

interface SlotWithItem {
  id: string;
  slotType: string;
  position: number;
  closetItemId: string | null;
  itemImageUrl: string | null;
  itemCategory: string | null;
  itemSubCategory: string | null;
  itemColors: string[] | null;
}

interface ArchiveOutfit extends Outfit {
  slots?: { slotType: string; itemImageUrl: string | null; itemSubCategory: string | null }[];
}

interface OutfitDetailClientProps {
  outfit: Outfit;
  slots: SlotWithItem[];
  archiveOutfits?: ArchiveOutfit[];
}

const slotLabels: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessory",
};

export function OutfitDetailClient({ outfit, slots, archiveOutfits = [] }: OutfitDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const slotOrder = ["top", "bottom", "shoes", "outerwear", "accessory"];
  const sortedSlots = [...slots].sort((a, b) => slotOrder.indexOf(a.slotType) - slotOrder.indexOf(b.slotType));
  const primarySlots = sortedSlots.filter((s) => s.slotType === "top" || s.slotType === "bottom");
  const secondarySlots = sortedSlots.filter((s) => s.slotType === "shoes" || s.slotType === "outerwear" || s.slotType === "accessory");

  const handleDelete = async () => {
    if (!confirm("Delete this outfit?")) return;
    await fetch(`/api/outfits/${outfit.id}`, { method: "DELETE" });
    toast("Outfit deleted", "info");
    router.push("/outfits");
    router.refresh();
  };

  const createdDate = new Date(outfit.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <div className="mb-12">
        <nav className="label-text text-on-surface-variant tracking-widest mb-4 block">
          <Link href="/outfits" className="hover:text-on-surface transition-colors">OUTFITS</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{(outfit.name || "Untitled Outfit").toUpperCase()}</span>
        </nav>
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-display-sm text-on-surface">{outfit.name || "Untitled Outfit"}</h1>
          <div className="flex items-center gap-4">
            <ShareButton outfitId={outfit.id} shareToken={outfit.shareToken} />
            <OutfitRating outfitId={outfit.id} initialRating={outfit.rating} />
            <Button variant="tertiary" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
        {/* ── Main Content ── */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {primarySlots.map((slot) => (
              <div key={slot.id}>
                <span className="label-text text-on-surface-variant tracking-widest block mb-3">
                  {(slotLabels[slot.slotType] ?? slot.slotType).toUpperCase()}
                </span>
                <OutfitSlot slotType={slot.slotType} imageUrl={slot.itemImageUrl} category={slot.itemCategory} subCategory={slot.itemSubCategory} />
              </div>
            ))}
          </div>

          {secondarySlots.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
              {secondarySlots.map((slot) => (
                <div key={slot.id}>
                  <span className="label-text text-on-surface-variant tracking-widest block mb-3">
                    {(slotLabels[slot.slotType] ?? slot.slotType).toUpperCase()}
                  </span>
                  <OutfitSlot slotType={slot.slotType} imageUrl={slot.itemImageUrl} category={slot.itemCategory} subCategory={slot.itemSubCategory} />
                </div>
              ))}
            </div>
          )}

          <section className="py-12 border-t border-outline-variant/10">
            <h2 className="font-serif text-headline-sm text-on-surface mb-4 italic">Style Notes</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">{outfit.feedback ?? "Rate this outfit and add your thoughts to help the AI learn your preferences."}</p>
          </section>

          {/* Complete the Look */}
          <section className="py-12 border-t border-outline-variant/10">
            <h2 className="font-serif text-headline-sm text-on-surface mb-6">
              Complete the Look
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Shop similar pieces from our curated catalog to recreate this outfit.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => window.location.href = "/catalog"}>
                BROWSE CATALOG
              </Button>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-8">
          <div className="bg-surface-container-lowest p-6 shadow-ambient">
            <p className="label-text text-on-surface-variant tracking-widest mb-6">CURATOR&apos;S SHOPPING LIST</p>
            <div className="space-y-4">
              {sortedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 flex-shrink-0 bg-surface-container-low relative overflow-hidden">
                    {slot.itemImageUrl ? (
                      <Image src={slot.itemImageUrl} alt={slot.itemSubCategory ?? slot.itemCategory ?? slot.slotType} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[9px] text-on-surface-variant uppercase">{slot.slotType}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-body-lg text-on-surface capitalize truncate">
                      {slot.itemSubCategory ?? slot.itemCategory ?? slotLabels[slot.slotType]}
                    </p>
                    <span className="label-text text-on-surface-variant text-label-md tracking-widest">
                      {slotLabels[slot.slotType]?.toUpperCase()}
                    </span>
                    <span className="label-text text-primary text-label-md tracking-widest block mt-0.5">
                      YOUR CLOSET
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
              <span className="label-text text-on-surface-variant tracking-widest">TOTAL PIECES</span>
              <span className="font-serif text-headline-sm text-on-surface">{sortedSlots.length}</span>
            </div>
          </div>

          <Link href="/outfits" className="block">
            <Button variant="tertiary" className="w-full">VIEW SIMILAR OUTFITS</Button>
          </Link>
        </aside>
      </div>

      {/* ── More from the Archive ── */}
      {archiveOutfits.length > 0 && (
        <section className="mt-16 pt-12 border-t border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-headline-md text-on-surface">More from the Archive</h2>
            <Link href="/outfits">
              <Button variant="tertiary">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {archiveOutfits.map((o) => {
              const topSlot = o.slots?.find((s) => s.slotType === "top");
              const previewImage = topSlot?.itemImageUrl;
              return (
                <Link key={o.id} href={`/outfits/${o.id}`} className="group block relative">
                  <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low">
                    {previewImage ? (
                      <img src={previewImage} alt={o.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-surface-container-low" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-on-surface/60 to-transparent p-4">
                      <p className="font-serif text-title-md text-white">{o.name}</p>
                      <span className="label-text text-white/70 text-label-md tracking-widest">{o.slots?.length ?? 0} PIECES</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
