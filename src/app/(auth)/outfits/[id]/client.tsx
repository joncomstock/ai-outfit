"use client";

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

interface OutfitDetailClientProps {
  outfit: Outfit;
  slots: SlotWithItem[];
}

export function OutfitDetailClient({ outfit, slots }: OutfitDetailClientProps) {
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
        <span className="label-text text-on-surface-variant tracking-widest mb-3 block">OUTFIT COMPOSITION — {createdDate.toUpperCase()}</span>
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-display-sm text-on-surface">{outfit.name || "Untitled Outfit"}</h1>
          <div className="flex items-center gap-4">
            <ShareButton outfitId={outfit.id} shareToken={outfit.shareToken} />
            <OutfitRating outfitId={outfit.id} initialRating={outfit.rating} />
            <Button variant="tertiary" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {primarySlots.map((slot) => (
          <OutfitSlot key={slot.id} slotType={slot.slotType} imageUrl={slot.itemImageUrl} category={slot.itemCategory} subCategory={slot.itemSubCategory} />
        ))}
      </div>

      {secondarySlots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {secondarySlots.map((slot) => (
            <OutfitSlot key={slot.id} slotType={slot.slotType} imageUrl={slot.itemImageUrl} category={slot.itemCategory} subCategory={slot.itemSubCategory} />
          ))}
        </div>
      )}

      <section className="py-12 border-t border-outline-variant/10">
        <h2 className="font-serif text-headline-sm text-on-surface mb-4 italic">Style Notes</h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">{outfit.feedback ?? "Rate this outfit and add your thoughts to help the AI learn your preferences."}</p>
      </section>

      {/* Shop Similar */}
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
  );
}
