"use client";

import { useState } from "react";

interface OutfitRatingProps {
  outfitId: string;
  initialRating?: number | null;
  onRate?: (rating: number) => void;
}

export function OutfitRating({ outfitId, initialRating, onRate }: OutfitRatingProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleRate = async (value: number) => {
    setSaving(true);
    setRating(value);
    try {
      await fetch(`/api/outfits/${outfitId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      onRate?.(value);
    } catch {
      setRating(initialRating ?? 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => handleRate(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)} disabled={saving} className="p-0.5 transition-colors" aria-label={`Rate ${star} stars`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= (hovered || rating) ? "#974232" : "none"} stroke="#974232" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
