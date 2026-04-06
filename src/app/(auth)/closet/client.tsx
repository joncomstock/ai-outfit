"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ClosetGrid } from "@/components/closet/closet-grid";
import { ClosetStats } from "@/components/closet/closet-stats";
import { UploadModal } from "@/components/closet/upload-modal";
import type { ClosetItem } from "@/db/schema/closet-items";

interface ClosetPageClientProps {
  initialItems: ClosetItem[];
}

export function ClosetPageClient({ initialItems }: ClosetPageClientProps) {
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  const handleUploadComplete = useCallback(
    (_itemId: string, _jobId: string) => {
      router.refresh();
    },
    [router]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-display-sm text-on-surface">
            Your Closet
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-1">
            {initialItems.length} items
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>Add Item</Button>
      </div>

      {initialItems.length > 0 && <ClosetStats />}

      {initialItems.length === 0 ? (
        <EmptyState
          title="Your closet is empty"
          description="Upload photos of your clothing and our AI will analyze each piece — identifying colors, style, fit, and more."
          actionLabel="Upload Your First Item"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        <ClosetGrid items={initialItems} />
      )}

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
