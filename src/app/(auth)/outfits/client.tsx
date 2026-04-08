"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { OutfitCard } from "@/components/outfits/outfit-card";
import { GenerationModal } from "@/components/outfits/generation-modal";
import type { Outfit } from "@/db/schema/outfits";
import type { ClosetItem } from "@/db/schema/closet-items";

interface OutfitsPageClientProps {
  outfits: (Outfit & { slots?: { slotType: string; itemImageUrl: string | null; itemSubCategory: string | null }[] })[];
  closetItems: ClosetItem[];
}

export function OutfitsPageClient({ outfits, closetItems }: OutfitsPageClientProps) {
  const [showGenerate, setShowGenerate] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "trend_based" || mode === "style_this") {
      setShowGenerate(true);
    }
  }, [searchParams]);

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="label-text text-on-surface-variant tracking-widest mb-2 block">YOUR LOOKBOOK</span>
          <h1 className="font-serif text-display-sm text-on-surface">Curated Outfits</h1>
        </div>
        <Button onClick={() => setShowGenerate(true)}>+ GENERATE OUTFIT</Button>
      </div>

      {outfits.length === 0 ? (
        <EmptyState title="No outfits yet" description="Generate your first AI-curated outfit from your wardrobe. Our stylist will compose the perfect look." actionLabel="Generate Your First Outfit" onAction={() => setShowGenerate(true)} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {outfits.map((outfit) => (<OutfitCard key={outfit.id} outfit={outfit} />))}
        </div>
      )}

      <GenerationModal isOpen={showGenerate} onClose={() => setShowGenerate(false)} closetItems={closetItems} />
    </div>
  );
}
