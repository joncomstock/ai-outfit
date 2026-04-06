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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <p className="label-text text-on-surface-variant mb-3">
            ARCHIVE MANAGEMENT
          </p>
          <h1 className="font-serif text-display-sm text-on-surface mb-3">
            Your Digital Closet
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-lg">
            A curated perspective on your personal style. High-resolution
            catalog of your seasonal rotations and timeless essentials.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => setShowUpload(true)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mr-2"
            >
              <line x1="7" y1="1" x2="7" y2="13" />
              <line x1="1" y1="7" x2="13" y2="7" />
            </svg>
            UPLOAD NEW ITEM
          </Button>
        </div>
      </div>

      {initialItems.length === 0 ? (
        <EmptyState
          title="Your closet is empty"
          description="Upload photos of your clothing and our AI will analyze each piece — identifying colors, style, fit, and more."
          actionLabel="Upload Your First Item"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        /* Two-column layout: sidebar + main grid */
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <ClosetStats />
          </div>
          <div className="flex-1 min-w-0">
            <ClosetGrid items={initialItems} />
          </div>
        </div>
      )}

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
