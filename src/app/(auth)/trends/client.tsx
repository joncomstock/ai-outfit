"use client";

import { useState, useCallback } from "react";
import { TrendCard } from "@/components/trends/trend-card";
import type { Trend } from "@/db/schema/trends";

const CATEGORY_TABS = [
  { key: "all", label: "ALL PERSPECTIVES" },
  { key: "luxury", label: "LUXURY" },
  { key: "streetwear", label: "STREETWEAR" },
  { key: "minimalism", label: "MINIMALISM" },
  { key: "avant_garde", label: "AVANT-GARDE" },
] as const;

interface TrendsClientProps {
  trends: Trend[];
}

export function TrendsClient({ trends: initialTrends }: TrendsClientProps) {
  const [trends, setTrends] = useState(initialTrends);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchTrends = useCallback(async (category: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);

    const res = await fetch(`/api/trends?${params}`);
    const data = await res.json();
    setTrends(data.trends);
    setLoading(false);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchTrends(tab);
  };

  const featuredTrend = trends[0];
  const remainingTrends = trends.slice(1);

  return (
    <div>
      {/* Editorial Hero */}
      <section className="py-16 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="label-text text-on-surface-variant tracking-widest mb-6 block">
              DISCOVERY JOURNAL
            </span>
            <h1 className="font-serif text-display-lg text-on-surface leading-tight">
              Seasonal
              <br />
              <span className="font-bold text-primary">Sentiments</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-lg mt-6">
              Our digital curator distills global aesthetic shifts into actionable
              style narratives. Explore the high-impact trends defining the
              current luxury landscape.
            </p>
          </div>
          {featuredTrend && (
            <div className="hidden lg:block">
              <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                <img
                  src={featuredTrend.heroImageUrl}
                  alt={featuredTrend.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="flex items-center justify-between mb-10 py-6 border-t border-b border-outline-variant/10">
        <div className="flex gap-6 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`label-text whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Alternating Trend Layout */}
      <section className="mb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`bg-surface-container-low animate-pulse ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[3/4]"}`}
              />
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-headline-sm text-on-surface-variant">
              No trends discovered yet
            </p>
            <p className="text-body-md text-on-surface-variant mt-2">
              Check back soon for emerging style narratives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.map((trend, index) => {
              const isFeatured = index % 4 === 0;
              return (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  featured={isFeatured}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t border-outline-variant/10 text-center mb-16">
        <p className="text-body-lg text-on-surface-variant italic mb-4">
          The algorithm continues to analyze...
        </p>
        <h2 className="font-serif text-headline-md text-on-surface">
          More sentiments emerging soon
        </h2>
      </section>
    </div>
  );
}
