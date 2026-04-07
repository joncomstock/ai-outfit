"use client";

import type { Product } from "@/db/schema/products";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, featured = false, onSelect }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <button
      onClick={() => onSelect(product)}
      className={`group text-left w-full transition-opacity duration-200 hover:opacity-90 ${
        featured ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden bg-surface-container-low ${featured ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-3">
        <p className="text-label-md uppercase tracking-widest text-on-surface-variant font-sans">
          {product.brand}
        </p>
        <h3 className="font-serif text-body-lg text-on-surface mt-1 leading-snug">
          {product.name}
        </h3>
        <p className="font-serif text-body-md text-on-surface-variant mt-1">
          {formattedPrice}
        </p>
      </div>
    </button>
  );
}
