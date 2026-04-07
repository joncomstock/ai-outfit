"use client";

import { useState, useCallback } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";
import { Button } from "@/components/ui/button";
import type { Product } from "@/db/schema/products";

const CATEGORY_TABS = [
  { key: "all", label: "ALL PIECES" },
  { key: "outerwear", label: "OUTERWEAR" },
  { key: "bags", label: "BAGS + SHOES" },
  { key: "tops", label: "TOPS" },
  { key: "bottoms", label: "BOTTOMS" },
] as const;

interface CatalogClientProps {
  initialProducts: Product[];
  brands: string[];
}

export function CatalogClient({ initialProducts, brands }: CatalogClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (category: string, brand: string | null, sortBy: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") {
        if (category === "bags") {
          params.set("category", "bags");
        } else {
          params.set("category", category);
        }
      }
      if (brand) params.set("brand", brand);
      params.set("sort", sortBy);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products);
      setLoading(false);
    },
    []
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchProducts(tab, selectedBrand, sort);
  };

  const handleBrandChange = (brand: string | null) => {
    setSelectedBrand(brand);
    fetchProducts(activeTab, brand, sort);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    fetchProducts(activeTab, selectedBrand, newSort);
  };

  return (
    <div>
      {/* Editorial Hero */}
      <section className="py-16 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="label-text text-on-surface-variant tracking-widest mb-6 block">
              CURATED COLLECTION
            </span>
            <h1 className="font-serif text-display-sm md:text-display-lg text-on-surface leading-tight">
              The Digital
              <br />
              <span className="italic text-primary">Curator.</span>
            </h1>
          </div>
          <div className="flex items-end">
            <p className="text-body-lg text-on-surface-variant max-w-md">
              An expertly curated selection of the season&apos;s definitive silhouettes,
              ethically sourced and digitally cataloged for the modern minimalist.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Row */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 py-6 border-t border-b border-outline-variant/10">
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
        <div className="flex gap-4">
          <select
            value={selectedBrand ?? ""}
            onChange={(e) => handleBrandChange(e.target.value || null)}
            className="bg-transparent text-body-md text-on-surface-variant font-sans border-none cursor-pointer"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-transparent text-body-md text-on-surface-variant font-sans border-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Asymmetric Product Grid */}
      <section className="mb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-headline-sm text-on-surface-variant">No pieces found</p>
            <p className="text-body-md text-on-surface-variant mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const isFeatured = index % 5 === 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={isFeatured}
                  onSelect={setSelectedProduct}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 border-t border-outline-variant/10 text-center mb-16">
        <h2 className="font-serif text-headline-md text-on-surface mb-3">
          Expert curation, delivered to your inbox
        </h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          Join 50,000+ style enthusiasts. Unsubscribe anytime.
        </p>
        <div className="flex justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 bg-surface-container-low px-4 py-3 text-body-md font-sans text-on-surface ghost-border focus:outline-none"
          />
          <Button>SUBSCRIBE</Button>
        </div>
      </section>

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
