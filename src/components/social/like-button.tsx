"use client";

import { useState } from "react";

interface Props {
  outfitId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ outfitId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/outfits/${outfitId}/like`, { method });
      if (res.ok) {
        const data = await res.json();
        setLiked(!liked);
        setCount(data.likeCount);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-body-md transition-colors disabled:opacity-50"
      aria-label={liked ? "Unlike outfit" : "Like outfit"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={liked ? 0 : 1.5}
        className={`w-5 h-5 ${liked ? "text-primary" : "text-on-surface-variant"}`}
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
      <span className={liked ? "text-primary" : "text-on-surface-variant"}>
        {count}
      </span>
    </button>
  );
}
