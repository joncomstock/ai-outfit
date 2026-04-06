"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalItems: number;
  readyItems: number;
  processingItems: number;
  categoryCounts: Record<string, number>;
  colorFrequency: Record<string, number>;
  tagFrequency: Record<string, number>;
  outfitReady: boolean;
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
    .slice(0, 8);

  const topTags = Object.entries(stats.tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <Card className="p-6">
        <p className="label-text text-on-surface-variant mb-1">Total Items</p>
        <p className="font-serif text-display-sm text-on-surface">
          {stats.totalItems}
        </p>
        {stats.processingItems > 0 && (
          <p className="text-body-md text-on-surface-variant mt-1">
            {stats.processingItems} processing
          </p>
        )}
      </Card>

      <Card className="p-6">
        <p className="label-text text-on-surface-variant mb-1">Outfit Ready</p>
        <Badge variant={stats.outfitReady ? "success" : "warning"}>
          {stats.outfitReady ? "Ready" : "Need more items"}
        </Badge>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(stats.categoryCounts).map(([cat, count]) => (
            <span key={cat} className="text-body-md text-on-surface-variant capitalize">
              {cat}: {count}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="label-text text-on-surface-variant mb-2">Your Colors</p>
        <div className="flex flex-wrap gap-2">
          {topColors.map(([color]) => (
            <span
              key={color}
              className="w-6 h-6 inline-block"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {topTags.length > 0 && (
          <>
            <p className="label-text text-on-surface-variant mb-2 mt-4">
              Top Styles
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(([tag]) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
