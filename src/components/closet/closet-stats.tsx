"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalItems: number;
  readyItems: number;
  processingItems: number;
  categoryCounts: Record<string, number>;
  colorFrequency: Record<string, number>;
  tagFrequency: Record<string, number>;
  outfitReady: boolean;
}

const COLOR_NAMES: Record<string, string> = {
  "#000000": "INK",
  "#ffffff": "SNOW",
  "#1b1c1a": "ONYX",
  "#f5f5dc": "CREAM",
  "#808080": "SLATE",
  "#a0522d": "SIENNA",
  "#8b4513": "SADDLE",
  "#d2691e": "AMBER",
  "#c0392b": "GARNET",
  "#2c3e50": "NAVY",
  "#27ae60": "MOSS",
  "#f39c12": "MARIGOLD",
};

function getColorName(hex: string): string {
  const upper = hex.toUpperCase();
  if (COLOR_NAMES[hex.toLowerCase()]) return COLOR_NAMES[hex.toLowerCase()];
  if (COLOR_NAMES[upper]) return COLOR_NAMES[upper];
  // Generate a short label from the hex
  return upper.replace("#", "").slice(0, 4);
}

export function ClosetStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/closet/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const topColors = Object.entries(stats.colorFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const topTags = Object.entries(stats.tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const styleTier =
    stats.totalItems >= 100
      ? "Premium"
      : stats.totalItems >= 50
        ? "Curated"
        : stats.totalItems >= 20
          ? "Essential"
          : "Capsule";

  return (
    <aside className="w-full space-y-6">
      {/* Inventory Analysis */}
      <div className="bg-surface-container-lowest p-6 shadow-ambient">
        <p className="label-text text-on-surface-variant mb-6">
          Inventory Analysis
        </p>

        <div className="space-y-5">
          <div>
            <p className="label-text text-on-surface-variant text-xs mb-1">
              TOTAL ITEMS
            </p>
            <p className="font-serif text-display-sm text-on-surface">
              {stats.totalItems}
            </p>
            {stats.processingItems > 0 && (
              <p className="text-body-md text-on-surface-variant mt-0.5">
                {stats.processingItems} processing
              </p>
            )}
          </div>

          <div>
            <p className="label-text text-on-surface-variant text-xs mb-1">
              STYLE TIER
            </p>
            <p className="font-serif text-headline-md text-on-surface">
              {styleTier}
            </p>
          </div>

          {topColors.length > 0 && (
            <div>
              <p className="label-text text-on-surface-variant text-xs mb-2">
                PALETTE
              </p>
              <div className="flex flex-wrap gap-3">
                {topColors.map(([color]) => (
                  <div key={color} className="flex flex-col items-center gap-1">
                    <span
                      className="w-8 h-8 block"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] tracking-widest uppercase text-on-surface-variant font-sans">
                      {getColorName(color)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div>
            <p className="label-text text-on-surface-variant text-xs mb-2">
              CATEGORIES
            </p>
            <div className="space-y-1.5">
              {Object.entries(stats.categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between text-body-md"
                >
                  <span className="text-on-surface capitalize">{cat}</span>
                  <span className="text-on-surface-variant font-serif">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tags */}
      {topTags.length > 0 && (
        <div className="bg-surface-container-lowest p-6 shadow-ambient">
          <p className="label-text text-on-surface-variant mb-4">
            Trending Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag]) => (
              <span
                key={tag}
                className="bg-surface-container-low px-3 py-1.5 text-label-lg uppercase tracking-widest text-on-surface-variant font-sans text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
