"use client";

import { useState } from "react";
import { ClosetItemCard } from "./closet-item-card";
import type { ClosetItem } from "@/db/schema/closet-items";

const categories = [
  "all",
  "tops",
  "bottoms",
  "shoes",
  "outerwear",
  "accessories",
];

interface ClosetGridProps {
  items: ClosetItem[];
  onItemClick?: (item: ClosetItem) => void;
}

export function ClosetGrid({ items, onItemClick }: ClosetGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`label-text whitespace-nowrap px-4 py-2 transition-colors duration-150 ${
              activeCategory === cat
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((item) => (
          <ClosetItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>
    </div>
  );
}
