"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Capsule } from "@/db/schema/capsules";
import { CapsuleCard } from "@/components/capsules/capsule-card";
import { EmptyState } from "@/components/empty-state";

interface Props {
  capsules: Capsule[];
}

export function CapsulesClient({ capsules: initialCapsules }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/capsules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { jobId } = await res.json();
        // Poll job status — reuse existing SSE pattern
        router.push(`/capsules?generating=${jobId}`);
        router.refresh();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-display-sm text-on-surface">
          Capsule Wardrobes
        </h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Capsule"}
        </button>
      </div>

      {initialCapsules.length === 0 ? (
        <EmptyState
          title="No capsule wardrobes yet"
          description="Generate your first capsule wardrobe to see curated outfit combinations from your closet."
          actionLabel="Generate Capsule"
          onAction={handleGenerate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCapsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
