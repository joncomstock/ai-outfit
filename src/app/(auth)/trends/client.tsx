"use client";

import { useState, useCallback } from "react";
import { TrendCard } from "@/components/trends/trend-card";
import { Button } from "@/components/ui/button";
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
          <div className="space-y-6">
            {(() => {
              const rows: React.ReactNode[] = [];
              let i = 0;
              while (i < trends.length) {
                // Featured full-width card
                rows.push(
                  <div key={`featured-${i}`} className="grid grid-cols-1">
                    <TrendCard trend={trends[i]} featured />
                  </div>
                );
                i++;
                // Next 2 side-by-side
                if (i < trends.length) {
                  const pair = trends.slice(i, i + 2);
                  rows.push(
                    <div key={`pair-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pair.map((t) => (
                        <TrendCard key={t.id} trend={t} />
                      ))}
                    </div>
                  );
                  i += pair.length;
                }
              }
              return rows;
            })()}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="mt-16 py-16 bg-surface-container-low">
        <div className="max-w-xl mx-auto text-center">
          <p className="label-text text-on-surface-variant mb-4">STAY CURRENT</p>
          <h3 className="font-serif text-headline-md text-on-surface mb-3 italic">
            The algorithm&apos;s next move is analysis...
          </h3>
          <p className="text-body-lg text-on-surface-variant mb-8">
            Subscribe to receive trend alerts and styling insights.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-surface border border-outline-variant/30 px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
            />
            <Button>SUBSCRIBE</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
