"use client";

import Link from "next/link";
import type { Capsule } from "@/db/schema/capsules";

interface Props {
  capsule: Capsule;
}

export function CapsuleCard({ capsule }: Props) {
  const pieceCount = capsule.pieces?.length ?? 0;
  const gapCount = capsule.gapAnalysis?.length ?? 0;

  return (
    <Link
      href={`/capsules/${capsule.id}`}
      className="block bg-surface-container p-6 hover:bg-surface-container-high transition-colors"
    >
      <h3 className="font-serif text-headline-sm text-on-surface mb-2">
        {capsule.name}
      </h3>
      <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
        {capsule.description}
      </p>
      <div className="flex gap-4">
        {capsule.season && (
          <span className="label-text text-on-surface-variant">
            {capsule.season}
          </span>
        )}
        <span className="label-text text-on-surface-variant">
          {pieceCount} pieces
        </span>
        {gapCount > 0 && (
          <span className="label-text text-primary">
            {gapCount} gaps
          </span>
        )}
      </div>
      <p className="text-body-md text-on-surface-variant mt-3">
        {new Date(capsule.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}
