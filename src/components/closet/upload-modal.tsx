"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { trackItemUploaded } from "@/lib/analytics/events";
import { trackFirstUpload } from "@/lib/analytics/funnel";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (itemId: string, jobId: string) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast("Please upload an image file", "error");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/closet/items", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { id, jobId } = await res.json();
        trackItemUploaded();
        trackFirstUpload();
        onUploadComplete(id, jobId);
        onClose();
        toast("Item uploaded — analyzing now", "success");
      } catch {
        toast("Failed to upload image", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onClose, toast]
  );

  const handleUrlSubmit = useCallback(async () => {
    if (!sourceUrl.trim()) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("sourceUrl", sourceUrl);
      const res = await fetch("/api/closet/items", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { id, jobId } = await res.json();
      trackItemUploaded();
      trackFirstUpload();
      onUploadComplete(id, jobId);
      onClose();
      toast("Item added — analyzing now", "success");
    } catch {
      toast("Failed to add item from URL", "error");
    } finally {
      setIsUploading(false);
      setSourceUrl("");
    }
  }, [sourceUrl, onUploadComplete, onClose, toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Closet" className="max-w-lg">
      <div
        className={`border-2 border-dashed p-6 md:p-12 text-center transition-colors duration-200 ${
          isDragging
            ? "border-primary bg-primary-fixed/20"
            : "border-outline-variant/30 hover:border-outline-variant/60"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <p className="font-serif text-headline-sm text-on-surface mb-2">
          Drop your image here
        </p>
        <p className="text-body-md text-on-surface-variant mb-6">
          or click to browse
        </p>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="file-upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <label htmlFor="file-upload">
          <Button
            variant="secondary"
            disabled={isUploading}
            type="button"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            {isUploading ? "Uploading..." : "Choose File"}
          </Button>
        </label>
      </div>

      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-outline-variant/20" />
        <span className="label-text text-on-surface-variant">or paste url</span>
        <div className="flex-1 h-px bg-outline-variant/20" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="https://example.com/product-image.jpg"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <Button
          onClick={handleUrlSubmit}
          disabled={isUploading || !sourceUrl.trim()}
        >
          {isUploading ? "Adding..." : "Add"}
        </Button>
      </div>
    </Modal>
  );
}
