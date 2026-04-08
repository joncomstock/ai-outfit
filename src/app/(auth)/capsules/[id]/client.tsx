"use client";

import Link from "next/link";
import type { Capsule } from "@/db/schema/capsules";
import type { ClosetItem } from "@/db/schema/closet-items";
import { CapsulePieces } from "@/components/capsules/capsule-pieces";
import { GapAnalysis } from "@/components/capsules/gap-analysis";

interface OutfitLink {
  outfitId: string;
  outfitName: string;
  position: number;
}

interface Props {
  capsule: Capsule;
  pieces: ClosetItem[];
  outfits: OutfitLink[];
}

export function CapsuleDetailClient({ capsule, pieces, outfits }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/capsules"
        className="text-label-lg uppercase tracking-widest text-on-surface-variant hover:text-on-surface mb-4 inline-block"
      >
        Back to Capsules
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-display-sm text-on-surface mb-2">
          {capsule.name}
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          {capsule.description}
        </p>
        <div className="flex gap-4 mt-3">
          {capsule.season && (
            <span className="label-text text-on-surface-variant">
              {capsule.season}
            </span>
          )}
          {capsule.theme && (
            <span className="label-text text-on-surface-variant">
              {capsule.theme}
            </span>
          )}
        </div>
      </div>

      {/* Capsule Pieces */}
      <section className="mb-12">
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Your Pieces
        </h2>
        <CapsulePieces pieces={pieces} />
      </section>

      {/* Outfit Combinations */}
      <section className="mb-12">
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Outfit Combinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outfits.map((outfit) => (
            <Link
              key={outfit.outfitId}
              href={`/outfits/${outfit.outfitId}`}
              className="bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
            >
              <p className="font-serif text-title-lg text-on-surface">
                {outfit.outfitName}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Gap Analysis */}
      {capsule.gapAnalysis && capsule.gapAnalysis.length > 0 && (
        <section>
          <h2 className="font-serif text-headline-md text-on-surface mb-4">
            Wardrobe Gaps
          </h2>
          <GapAnalysis gaps={capsule.gapAnalysis} />
        </section>
      )}
    </div>
  );
}
