import Image from "next/image";
import Link from "next/link";
import type { Outfit } from "@/db/schema/outfits";

interface OutfitCardProps {
  outfit: Outfit & {
    slots?: { slotType: string; itemImageUrl: string | null; itemSubCategory: string | null }[];
  };
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const topSlot = outfit.slots?.find((s) => s.slotType === "top");
  const previewImage = topSlot?.itemImageUrl;

  return (
    <Link href={`/outfits/${outfit.id}`} className="group bg-surface-container-lowest transition-shadow duration-200 hover:shadow-ambient block">
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low">
        {previewImage ? (
          <Image src={previewImage} alt={outfit.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="label-text text-on-surface-variant">{outfit.name}</span>
          </div>
        )}
        {outfit.rating && (
          <div className="absolute top-3 right-3 flex gap-0.5">
            {Array.from({ length: outfit.rating }).map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#974232" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-serif text-title-md text-on-surface">{outfit.name}</p>
        <p className="label-text text-on-surface-variant text-label-md mt-1">{outfit.slots?.length ?? 0} PIECES</p>
      </div>
    </Link>
  );
}
