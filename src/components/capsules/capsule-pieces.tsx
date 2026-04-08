"use client";

import Image from "next/image";
import type { ClosetItem } from "@/db/schema/closet-items";

interface Props {
  pieces: ClosetItem[];
}

export function CapsulePieces({ pieces }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {pieces.map((piece) => (
        <div key={piece.id} className="bg-surface-container overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={piece.imageUrl}
              alt={piece.category ?? "Clothing item"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          </div>
          <div className="p-3">
            <p className="label-text text-on-surface-variant">
              {piece.category}
            </p>
            {piece.subCategory && (
              <p className="text-body-md text-on-surface">
                {piece.subCategory}
              </p>
            )}
            {piece.colors && piece.colors.length > 0 && (
              <div className="flex gap-1 mt-1">
                {piece.colors.map((color, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 inline-block ghost-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
