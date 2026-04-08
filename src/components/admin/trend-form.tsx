"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrendFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    heroImageUrl?: string;
    category?: string;
    momentumScore?: number;
    season?: string | null;
    status?: string;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function TrendForm({ initialData, onSubmit, onCancel }: TrendFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.heroImageUrl ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "minimalism");
  const [momentumScore, setMomentumScore] = useState(initialData?.momentumScore ?? 50);
  const [season, setSeason] = useState(initialData?.season ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name,
      description,
      heroImageUrl,
      category,
      momentumScore,
      season: season || null,
      status,
    });
    setSubmitting(false);
  };

  return (
    <div className="bg-surface-container-lowest p-8 ghost-border space-y-6 max-w-2xl">
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">NAME</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trend name" />
      </div>
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">DESCRIPTION</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Trend description"
          rows={3}
          className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="label-text text-on-surface-variant tracking-widest mb-2 block">HERO IMAGE URL</label>
        <Input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border"
          >
            <option value="luxury">Luxury</option>
            <option value="streetwear">Streetwear</option>
            <option value="minimalism">Minimalism</option>
            <option value="avant_garde">Avant-Garde</option>
            <option value="classic">Classic</option>
          </select>
        </div>
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">MOMENTUM SCORE</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={momentumScore}
            onChange={(e) => setMomentumScore(parseInt(e.target.value, 10))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">SEASON</label>
          <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g. Fall 2026" />
        </div>
        <div>
          <label className="label-text text-on-surface-variant tracking-widest mb-2 block">STATUS</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-outline-variant/10">
        <Button onClick={handleSubmit} disabled={submitting || !name || !description || !heroImageUrl}>
          {submitting ? "SAVING..." : initialData?.id ? "UPDATE TREND" : "CREATE TREND"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>CANCEL</Button>
      </div>
    </div>
  );
}
