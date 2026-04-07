"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  activeTrends: number;
  totalClicks: number;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="TOTAL USERS" value={stats.totalUsers} />
          <StatCard label="ACTIVE TRENDS" value={stats.activeTrends} />
          <StatCard label="CATALOG SIZE" value={stats.totalProducts} />
          <StatCard label="AFFILIATE CLICKS" value={stats.totalClicks} />
        </div>
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
