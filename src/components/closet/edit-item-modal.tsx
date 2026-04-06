"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { ClosetItem } from "@/db/schema/closet-items";

const categories = ["tops", "bottoms", "shoes", "outerwear", "accessories"];
const fits = ["slim", "regular", "relaxed", "oversized"];
const seasons = ["spring", "summer", "fall", "winter"];

interface EditItemModalProps {
  item: ClosetItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditItemModal({
  item,
  isOpen,
  onClose,
  onSave,
}: EditItemModalProps) {
  const [category, setCategory] = useState(item.category ?? "");
  const [subCategory, setSubCategory] = useState(item.subCategory ?? "");
  const [fit, setFit] = useState(item.fit ?? "regular");
  const [seasonality, setSeasonality] = useState<string[]>(
    item.seasonality ?? []
  );
  const [styleTags, setStyleTags] = useState<string[]>(item.styleTags ?? []);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const toggleSeason = (s: string) => {
    setSeasonality((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !styleTags.includes(tag) && styleTags.length < 8) {
      setStyleTags([...styleTags, tag]);
      setNewTag("");
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/closet/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subCategory,
          fit,
          seasonality,
          styleTags,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast("Item updated", "success");
      onSave();
      onClose();
    } catch {
      toast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  }, [item.id, category, subCategory, fit, seasonality, styleTags, toast, onSave, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Item" className="max-w-2xl">
      <div className="flex gap-8">
        <div className="w-48 shrink-0">
          <div className="aspect-[3/4] relative">
            <Image
              src={item.imageUrl}
              alt={item.subCategory ?? "Clothing item"}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <p className="label-text text-on-surface-variant mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 text-body-md capitalize transition-colors ${
                    category === cat
                      ? "editorial-gradient text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Sub-category"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            placeholder="e.g., t-shirt, blazer, sneakers"
          />

          <div>
            <p className="label-text text-on-surface-variant mb-2">Fit</p>
            <div className="flex gap-2">
              {fits.map((f) => (
                <button
                  key={f}
                  onClick={() => setFit(f)}
                  className={`px-4 py-1.5 text-body-md capitalize transition-colors ${
                    fit === f
                      ? "editorial-gradient text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-text text-on-surface-variant mb-2">Season</p>
            <div className="flex gap-2">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSeason(s)}
                  className={`px-4 py-1.5 text-body-md capitalize transition-colors ${
                    seasonality.includes(s)
                      ? "editorial-gradient text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-text text-on-surface-variant mb-2">
              Style Tags ({styleTags.length}/8)
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {styleTags.map((tag) => (
                <Badge key={tag}>
                  {tag}
                  <button
                    onClick={() =>
                      setStyleTags(styleTags.filter((t) => t !== tag))
                    }
                    className="ml-2 text-on-surface-variant hover:text-error"
                    aria-label={`Remove ${tag}`}
                  >
                    x
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-outline-variant/10">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}
