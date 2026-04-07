"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface CsvUploadProps {
  onImportComplete: (count: number) => void;
}

export function CsvUpload({ onImportComplete }: CsvUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Imported ${data.imported} products`, "success");
      onImportComplete(data.imported);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 ghost-border">
      <p className="label-text text-on-surface-variant tracking-widest mb-4">
        CSV IMPORT
      </p>
      <p className="text-body-md text-on-surface-variant mb-4">
        Upload a CSV with columns: name, brand, category, price, image_url, affiliate_url, description, colors, sizes, sku, currency
      </p>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="text-body-md text-on-surface font-sans"
        />
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "IMPORTING..." : "IMPORT CSV"}
        </Button>
      </div>
    </div>
  );
}
