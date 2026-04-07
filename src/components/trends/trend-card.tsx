"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Trend } from "@/db/schema/trends";

interface TrendCardProps {
  trend: Trend;
  featured?: boolean;
}

export function TrendCard({ trend, featured = false }: TrendCardProps) {
  const momentumVariant =
    trend.momentumScore >= 80
      ? "success"
      : trend.momentumScore >= 50
        ? "warning"
        : "default";

  return (
    <Link
      href={`/trends/${trend.id}`}
      className={`group block ${featured ? "col-span-2" : ""}`}
    >
      <div className={`relative overflow-hidden bg-surface-container-low ${featured ? "aspect-[16/9]" : "aspect-[3/4]"}`}>
        <img
          src={trend.heroImageUrl}
          alt={trend.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={momentumVariant}>{trend.momentumScore}</Badge>
        </div>
        {featured && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-on-surface/60 to-transparent p-8">
            <h3 className="font-serif text-headline-md text-white mb-2">
              {trend.name}
            </h3>
            <p className="text-body-md text-white/80 max-w-lg line-clamp-2">
              {trend.description}
            </p>
          </div>
        )}
      </div>
      {!featured && (
        <div className="mt-3">
          <h3 className="font-serif text-title-md text-on-surface group-hover:text-primary transition-colors duration-150">
            {trend.name}
          </h3>
          <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">
            {trend.description}
          </p>
          <span className="label-text text-primary mt-3 inline-block">
            EXPLORE TREND
          </span>
        </div>
      )}
    </Link>
  );
}
