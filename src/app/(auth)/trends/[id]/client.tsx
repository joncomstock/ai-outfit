"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";
import { useToast } from "@/components/ui/toast";
import type { Trend } from "@/db/schema/trends";
import type { Product } from "@/db/schema/products";
import { trackTrendSaved } from "@/lib/analytics/events";

interface TrendProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
}

interface TrendDetailClientProps {
  trend: Trend;
  products: TrendProduct[];
  isSaved: boolean;
}

export function TrendDetailClient({
  trend,
  products,
  isSaved: initialSaved,
}: TrendDetailClientProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const momentumVariant =
    trend.momentumScore >= 80
      ? "success"
      : trend.momentumScore >= 50
        ? "warning"
        : "default";

  const handleToggleSave = useCallback(async () => {
    setSavingBookmark(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`/api/trends/${trend.id}/save`, { method });
      if (!res.ok) throw new Error("Failed");
      if (!saved) {
        trackTrendSaved(trend.id);
      }
      setSaved(!saved);
      toast(saved ? "Trend removed from bookmarks" : "Trend bookmarked!", "success");
    } catch {
      toast("Failed to update bookmark", "error");
    } finally {
      setSavingBookmark(false);
    }
  }, [saved, trend.id, toast]);

  const handleGenerateFromTrend = () => {
    router.push(`/outfits?mode=trend_based&trendId=${trend.id}`);
  };

  const styleTags = Array.isArray(trend.styleTags) ? trend.styleTags : [];

  return (
    <div>
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 mb-12">
        <div className="flex flex-col justify-center">
          <span className="label-text text-on-surface-variant tracking-widest mb-4 block">
            TREND ANALYSIS
          </span>
          <h1 className="font-serif text-display-sm text-on-surface mb-4">
            {trend.name}
          </h1>
          <div className="flex items-center gap-3 mb-6">
            <Badge variant={momentumVariant}>MOMENTUM {trend.momentumScore}</Badge>
            {trend.season && <Badge>{trend.season.toUpperCase()}</Badge>}
            <Badge variant="default">{trend.category.toUpperCase().replace("_", " ")}</Badge>
          </div>
          <p className="text-body-lg text-on-surface-variant max-w-lg mb-8 leading-relaxed">
            {trend.description}
          </p>

          {styleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {styleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-container-low text-label-md text-on-surface-variant font-sans uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleGenerateFromTrend}>
              GENERATE OUTFIT FROM TREND
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleSave}
              disabled={savingBookmark}
            >
              {saved ? "SAVED" : "BOOKMARK"}
            </Button>
          </div>
        </div>
        <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
          <img
            src={trend.heroImageUrl}
            alt={trend.name}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Associated Products */}
      {products.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-headline-md text-on-surface">
              Curated Pieces
            </h2>
            <span className="label-text text-on-surface-variant">
              {products.length} ITEMS
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as Product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
