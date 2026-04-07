"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendForm } from "@/components/admin/trend-form";
import { useToast } from "@/components/ui/toast";
import type { Trend } from "@/db/schema/trends";

interface AdminTrendsClientProps {
  initialTrends: Trend[];
}

export function AdminTrendsClient({ initialTrends }: AdminTrendsClientProps) {
  const [trends, setTrends] = useState(initialTrends);
  const [showForm, setShowForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<Trend | null>(null);
  const { toast } = useToast();

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast("Failed to create trend", "error");
        return;
      }
      const newTrend = await res.json();
      setTrends((prev) => [newTrend, ...prev]);
      setShowForm(false);
      toast("Trend created", "success");
    },
    [toast]
  );

  const handleUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        toast("Failed to update trend", "error");
        return;
      }
      const updated = await res.json();
      setTrends((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTrend(null);
      toast("Trend updated", "success");
    },
    [toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this trend?")) return;
      const res = await fetch("/api/admin/trends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        toast("Failed to delete trend", "error");
        return;
      }
      setTrends((prev) => prev.filter((t) => t.id !== id));
      toast("Trend deleted", "info");
    },
    [toast]
  );

  const statusVariant = (status: string) =>
    status === "published" ? "success" : status === "draft" ? "warning" : "default";

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
            CONTENT MANAGEMENT
          </span>
          <h1 className="font-serif text-display-sm text-on-surface">
            Trend Management
          </h1>
        </div>
        <Button onClick={() => setShowForm(true)}>+ CREATE NEW TREND</Button>
      </div>

      {(showForm || editingTrend) && (
        <div className="mb-10">
          <TrendForm
            initialData={editingTrend ?? undefined}
            onSubmit={editingTrend ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingTrend(null);
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {trends.map((trend) => (
          <div
            key={trend.id}
            className="flex items-center gap-6 bg-surface-container-lowest p-4 ghost-border"
          >
            <div className="w-16 h-16 bg-surface-container-low overflow-hidden flex-shrink-0">
              <img
                src={trend.heroImageUrl}
                alt={trend.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-title-md text-on-surface truncate">
                {trend.name}
              </h3>
              <p className="text-body-md text-on-surface-variant truncate">
                {trend.description}
              </p>
            </div>
            <Badge variant={statusVariant(trend.status)}>
              {trend.status.toUpperCase()}
            </Badge>
            <span className="font-serif text-title-md text-on-surface w-12 text-right">
              {trend.momentumScore}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditingTrend(trend)}
                className="text-sm px-4 py-2"
              >
                EDIT
              </Button>
              <Button
                variant="tertiary"
                onClick={() => handleDelete(trend.id)}
                className="text-sm"
              >
                DELETE
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
