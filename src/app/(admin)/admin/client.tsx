"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  activeTrends: number;
  totalClicks: number;
  totalOutfits: number;
  totalClosetItems: number;
  sharedOutfits: number;
  range: string;
}

const TIME_RANGES = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");

  const fetchStats = async (timeRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${timeRange}`);
      const data = await res.json();
      setStats(data);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
          EXECUTIVE INTELLIGENCE
        </span>
        <h1 className="font-serif text-display-sm text-on-surface">
          Dashboard
        </h1>
      </div>

      {/* Time range filter */}
      <div className="flex gap-2 mb-8" role="group" aria-label="Time range filter">
        {TIME_RANGES.map((tr) => (
          <Button
            key={tr.value}
            variant={range === tr.value ? "primary" : "secondary"}
            onClick={() => setRange(tr.value)}
            className="text-label-md"
          >
            {tr.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <StatCard label="TOTAL USERS" value={stats.totalUsers} />
            <StatCard label="TOTAL OUTFITS" value={stats.totalOutfits} />
            <StatCard label="CLOSET ITEMS" value={stats.totalClosetItems} />
            <StatCard label="SHARED OUTFITS" value={stats.sharedOutfits} />
            <StatCard label="ACTIVE TRENDS" value={stats.activeTrends} />
            <StatCard label="CATALOG SIZE" value={stats.totalProducts} />
            <StatCard label="AFFILIATE CLICKS" value={stats.totalClicks} />
          </div>

          {/* Charts placeholder */}
          <section className="mt-8 mb-12">
            <h2 className="font-serif text-headline-sm text-on-surface mb-6">Activity Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest ghost-border p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-serif text-headline-sm text-on-surface-variant/30 mb-2">Outfit Generation Trend</p>
                  <p className="text-body-md text-on-surface-variant">Chart integration ready</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest ghost-border p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-serif text-headline-sm text-on-surface-variant/30 mb-2">Affiliate Click-Through</p>
                  <p className="text-body-md text-on-surface-variant">Chart integration ready</p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className="text-body-md text-error">Failed to load stats.</p>
      )}

      {/* System Health */}
      <section className="mt-12">
        <h2 className="font-serif text-headline-sm text-on-surface mb-6">
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "API UPTIME", value: "99.99%" },
            { label: "AI INFERENCE", value: "42ms" },
            { label: "DB RELIABILITY", value: "99.99%" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-surface-container-lowest p-4 ghost-border"
            >
              <p className="label-text text-on-surface-variant tracking-widest mb-1">
                {metric.label}
              </p>
              <p className="font-serif text-headline-sm text-tertiary">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
