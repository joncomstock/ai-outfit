"use client";

import Link from "next/link";

interface Gap {
  category: string;
  description: string;
  searchQuery: string;
}

interface Props {
  gaps: Gap[];
}

export function GapAnalysis({ gaps }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {gaps.map((gap, index) => (
        <div key={index} className="bg-surface-container p-6">
          <p className="label-text text-primary mb-2">{gap.category}</p>
          <p className="text-body-md text-on-surface mb-4">
            {gap.description}
          </p>
          <Link
            href={`/catalog?q=${encodeURIComponent(gap.searchQuery)}`}
            className="editorial-gradient inline-block px-4 py-2 text-white text-label-lg uppercase tracking-widest"
          >
            Shop to Fill Gap
          </Link>
        </div>
      ))}
    </div>
  );
}
