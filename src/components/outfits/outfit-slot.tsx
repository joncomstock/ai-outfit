import Image from "next/image";

interface OutfitSlotProps {
  slotType: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

const slotLabels: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessory",
};

export function OutfitSlot({ slotType, imageUrl, category, subCategory }: OutfitSlotProps) {
  return (
    <div className="group">
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-container-low mb-3">
        {imageUrl ? (
          <Image src={imageUrl} alt={subCategory ?? category ?? slotType} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="label-text text-on-surface-variant">{slotLabels[slotType] ?? slotType}</span>
          </div>
        )}
      </div>
      <p className="font-serif text-body-lg text-on-surface capitalize">{subCategory ?? category ?? slotLabels[slotType]}</p>
      <p className="label-text text-on-surface-variant text-label-md mt-0.5">{slotLabels[slotType]?.toUpperCase()}</p>
    </div>
  );
}
