"use client";

import { useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/db/schema/products";
import { trackAffiliateClick } from "@/lib/analytics/events";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { toast } = useToast();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 2,
  }).format(product.price);

  const handleShopNow = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sourceContext: "product_detail_modal",
        }),
      });

      if (!res.ok) throw new Error("Failed to track click");

      const { affiliateUrl } = await res.json();
      trackAffiliateClick(product.id);
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast("Failed to open shop link", "error");
    }
  }, [product.id, toast]);

  const colors = Array.isArray(product.colors) ? product.colors : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  return (
    <Modal isOpen onClose={onClose} className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-10 py-10">
        {/* Product Image */}
        <div className="aspect-[3/4] bg-surface-container-low overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="label-text text-on-surface-variant tracking-widest mb-2">
              {product.brand.toUpperCase()}
            </p>
            <h2 className="font-serif text-headline-md text-on-surface mb-2">
              {product.name}
            </h2>
            {product.sku && (
              <p className="text-body-md text-on-surface-variant mb-4">
                Ref. {product.sku}
              </p>
            )}
            <p className="font-serif text-headline-sm text-on-surface mb-6">
              {formattedPrice}
            </p>

            {product.description && (
              <p className="text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-4">
                <p className="label-text text-on-surface-variant tracking-widest mb-2">
                  COLORS
                </p>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <Badge key={color}>{color}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="label-text text-on-surface-variant tracking-widest mb-2">
                  AVAILABLE SIZES
                </p>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1.5 bg-surface-container-low text-body-md font-sans text-on-surface ghost-border"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-6 border-t border-outline-variant/10">
            <Button onClick={handleShopNow} className="w-full">
              SHOP NOW
            </Button>
            <Button variant="secondary" onClick={onClose} className="w-full">
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
