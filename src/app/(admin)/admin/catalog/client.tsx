"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CsvUpload } from "@/components/admin/csv-upload";
import type { Product } from "@/db/schema/products";

interface SyncResult {
  synced: number;
  errors: number;
}

interface AdminCatalogClientProps {
  initialProducts: Product[];
}

export function AdminCatalogClient({ initialProducts }: AdminCatalogClientProps) {
  const [products] = useState(initialProducts);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleImportComplete = () => {
    window.location.reload();
  };

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"] }),
      });
      const data = await res.json();
      setSyncResult({ synced: data.totalSynced ?? data.synced ?? 0, errors: data.totalErrors ?? data.errors ?? 0 });
    } catch {
      setSyncResult({ synced: 0, errors: 1 });
    } finally {
      setSyncing(false);
    }
  }

  const formattedPrice = (p: Product) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: p.currency,
      minimumFractionDigits: 0,
    }).format(p.price);

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">
          CONTENT MANAGEMENT
        </span>
        <h1 className="font-serif text-display-sm text-on-surface">
          Catalog Management
        </h1>
      </div>

      <div className="mb-10 flex items-center gap-4 flex-wrap">
        <CsvUpload onImportComplete={handleImportComplete} />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="editorial-gradient px-4 py-2 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Products"}
          </button>
          {syncResult && (
            <p className="text-body-md text-on-surface-variant">
              Synced {syncResult.synced} products{syncResult.errors > 0 ? `, ${syncResult.errors} errors` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                PRODUCT
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                BRAND
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                CATEGORY
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                PRICE
              </th>
              <th className="text-left label-text text-on-surface-variant tracking-widest py-3 px-4">
                STOCK
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container-low overflow-hidden flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-serif text-body-md text-on-surface">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-body-md text-on-surface-variant">
                  {product.brand}
                </td>
                <td className="py-3 px-4">
                  <Badge>{product.category.toUpperCase()}</Badge>
                </td>
                <td className="py-3 px-4 font-serif text-body-md text-on-surface">
                  {formattedPrice(product)}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={product.inStock ? "success" : "error"}>
                    {product.inStock ? "IN STOCK" : "OUT"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
