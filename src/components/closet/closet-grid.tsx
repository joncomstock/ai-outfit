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

const seasons = ["all seasons", "spring", "summer", "fall", "winter"];

const sortOptions = ["newest", "oldest"];

interface ClosetGridProps {
  items: ClosetItem[];
  onItemClick?: (item: ClosetItem) => void;
}

export function ClosetGrid({ items, onItemClick }: ClosetGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSeason, setActiveSeason] = useState("all seasons");
  const [sortBy, setSortBy] = useState("newest");

  let filtered =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  if (activeSeason !== "all seasons") {
    filtered = filtered.filter((item) =>
      item.seasonality?.some(
        (s) => s.toLowerCase() === activeSeason.toLowerCase()
      )
    );
  }

  if (sortBy === "oldest") {
    filtered = [...filtered].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } else {
    filtered = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <FilterDropdown
          value={activeCategory}
          options={categories}
          onChange={setActiveCategory}
          formatLabel={(v) =>
            v === "all" ? "ALL CATEGORIES" : v.toUpperCase()
          }
        />
        <FilterDropdown
          value={activeSeason}
          options={seasons}
          onChange={setActiveSeason}
          formatLabel={(v) =>
            v === "all seasons" ? "SEASONALITY" : v.toUpperCase()
          }
        />
        <FilterDropdown
          value={sortBy}
          options={sortOptions}
          onChange={setSortBy}
          formatLabel={(v) => `SORT BY: ${v.toUpperCase()}`}
        />

        <div className="ml-auto" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <ClosetItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-on-surface-variant text-body-lg py-16">
          No items match the current filters.
        </p>
      )}
    </div>
  );
}

/* ---- Filter Dropdown Button ---- */

interface FilterDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  formatLabel: (value: string) => string;
}

function FilterDropdown({
  value,
  options,
  onChange,
  formatLabel,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-surface-container-lowest shadow-ambient px-4 py-2.5 flex items-center gap-2 label-text text-xs text-on-surface hover:bg-surface-container-low transition-colors"
      >
        {formatLabel(value)}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface-container-lowest shadow-ambient min-w-[180px]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 label-text text-xs transition-colors ${
                  value === opt
                    ? "text-primary bg-surface-container-low"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {opt === "all" || opt === "all seasons"
                  ? opt.toUpperCase()
                  : opt.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
