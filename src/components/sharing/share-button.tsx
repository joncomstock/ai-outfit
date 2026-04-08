"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { trackFirstShare } from "@/lib/analytics/funnel";

interface ShareButtonProps {
  outfitId: string;
  shareToken: string | null;
}

export function ShareButton({ outfitId, shareToken }: ShareButtonProps) {
  const [token, setToken] = useState(shareToken);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (token) {
      await copyLink(token);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/outfits/${outfitId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate share link");
      const data = await res.json();
      setToken(data.shareToken);
      trackFirstShare();
      await copyLink(data.shareToken);
    } catch {
      toast("Failed to generate share link", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (t: string) => {
    const url = `${window.location.origin}/shared/outfits/${t}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Could not copy link", "error");
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleShare}
      disabled={loading}
      aria-label={token ? "Copy link" : "Share"}
    >
      {loading ? "Generating..." : token ? "Copy Link" : "Share"}
    </Button>
  );
}
