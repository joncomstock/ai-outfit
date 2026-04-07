"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ClosetItem } from "@/db/schema/closet-items";

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  closetItems?: ClosetItem[];
}

export function GenerationModal({ isOpen, onClose, closetItems = [] }: GenerationModalProps) {
  const [mode, setMode] = useState<"for_you" | "style_this">("for_you");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, sourceItemId: mode === "style_this" ? selectedItem : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      const { jobId } = await res.json();
      toast("Generating your outfit...", "info");
      onClose();

      const eventSource = new EventSource(`/api/jobs/${jobId}/status`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "ready") {
          eventSource.close();
          toast("Your outfit is ready!", "success");
          router.push("/outfits");
          router.refresh();
        } else if (data.status === "error") {
          eventSource.close();
          toast(data.error ?? "Generation failed", "error");
        }
      };
      eventSource.onerror = () => eventSource.close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to generate outfit", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, selectedItem, toast, onClose, router]);

  const readyItems = closetItems.filter((i) => i.status === "ready");
  const canGenerate = readyItems.length >= 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Outfit" className="max-w-xl">
      <div className="space-y-8">
        <div>
          <p className="label-text text-on-surface-variant mb-4">GENERATION MODE</p>
          <div className="flex gap-4">
            <button onClick={() => setMode("for_you")} className={`flex-1 p-6 text-left transition-colors ${mode === "for_you" ? "bg-primary-fixed/30 ghost-border" : "bg-surface-container-low hover:bg-surface-container"}`}>
              <p className="font-serif text-title-md text-on-surface mb-1">For You</p>
              <p className="text-body-md text-on-surface-variant">AI picks the best combination from your entire closet.</p>
            </button>
            <button onClick={() => setMode("style_this")} className={`flex-1 p-6 text-left transition-colors ${mode === "style_this" ? "bg-primary-fixed/30 ghost-border" : "bg-surface-container-low hover:bg-surface-container"}`}>
              <p className="font-serif text-title-md text-on-surface mb-1">Style This Item</p>
              <p className="text-body-md text-on-surface-variant">Build an outfit around a specific piece.</p>
            </button>
          </div>
        </div>

        {mode === "style_this" && (
          <div>
            <p className="label-text text-on-surface-variant mb-4">SELECT AN ITEM</p>
            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {readyItems.map((item) => (
                <button key={item.id} onClick={() => setSelectedItem(item.id)} className={`aspect-[3/4] relative overflow-hidden ${selectedItem === item.id ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"}`}>
                  <img src={item.imageUrl} alt={item.subCategory ?? "item"} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!canGenerate && (
          <p className="text-body-md text-error">You need at least 3 analyzed items (top, bottom, shoes) to generate an outfit.</p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !canGenerate || (mode === "style_this" && !selectedItem)}>
            {isGenerating ? "Generating..." : "Generate Outfit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
