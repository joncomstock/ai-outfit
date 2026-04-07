"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface AdminOutfit {
  id: string;
  name: string;
  generationMode: string;
  rating: number | null;
  shareToken: string | null;
  createdAt: string;
  userEmail: string | null;
  userDisplayName: string | null;
}

export function AdminOutfitsClient() {
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<AdminOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchOutfits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outfits?page=${page}&limit=20`);
      const data = await res.json();
      setOutfits(data.outfits ?? []);
    } catch {
      toast("Failed to load outfits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
  }, [page]);

  const handleDelete = async (outfitId: string, outfitName: string) => {
    if (!confirm(`Delete outfit "${outfitName || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await fetch("/api/admin/outfits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId }),
      });
      toast("Outfit deleted", "info");
      fetchOutfits();
    } catch {
      toast("Failed to delete outfit", "error");
    }
  };

  return (
    <div>
      <div className="mb-10">
        <span className="label-text text-on-surface-variant tracking-widest mb-2 block">MODERATION</span>
        <h1 className="font-serif text-display-sm text-on-surface">Outfit Moderation</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">OUTFIT</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">USER</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">MODE</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">RATING</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">SHARED</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">CREATED</th>
                <th className="text-left py-3 label-text text-on-surface-variant text-label-md tracking-widest">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {outfits.map((outfit) => (
                <tr key={outfit.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="py-4 text-body-md text-on-surface font-sans">{outfit.name || "Untitled"}</td>
                  <td className="py-4 text-body-md text-on-surface-variant font-sans">
                    {outfit.userDisplayName || outfit.userEmail || "—"}
                  </td>
                  <td className="py-4">
                    <Badge>{outfit.generationMode.replace("_", " ")}</Badge>
                  </td>
                  <td className="py-4 text-body-md text-on-surface font-sans">
                    {outfit.rating ? `${outfit.rating}/5` : "—"}
                  </td>
                  <td className="py-4">
                    {outfit.shareToken ? (
                      <Badge variant="success">Public</Badge>
                    ) : (
                      <span className="text-body-md text-on-surface-variant">Private</span>
                    )}
                  </td>
                  <td className="py-4 text-body-md text-on-surface-variant font-sans">
                    {new Date(outfit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <Button variant="tertiary" onClick={() => handleDelete(outfit.id, outfit.name)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </Button>
        <span className="text-body-md text-on-surface-variant font-sans">Page {page}</span>
        <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={outfits.length < 20}>
          Next
        </Button>
      </div>
    </div>
  );
}
