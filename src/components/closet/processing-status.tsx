"use client";

import { useSSE } from "@/hooks/use-sse";
import type { JobStatus } from "@/lib/jobs/job-store";
import { trackFirstProcessed } from "@/lib/analytics/funnel";

const statusMessages: Record<JobStatus, string> = {
  queued: "Preparing your item...",
  uploading: "Uploading image...",
  analyzing: "Our AI stylist is examining your piece...",
  detecting_colors: "Identifying colors and patterns...",
  detecting_fit: "Assessing fit and silhouette...",
  generating: "Generating your outfit...",
  ready: "Analysis complete!",
  error: "Something went wrong",
};

interface ProcessingStatusProps {
  jobId: string;
  onComplete?: () => void;
}

export function ProcessingStatus({ jobId, onComplete }: ProcessingStatusProps) {
  const { status, error } = useSSE(jobId);

  if (status === "ready") {
    trackFirstProcessed();
    onComplete?.();
  }

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      {status && status !== "ready" && status !== "error" && (
        <div className="w-48 h-0.5 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary editorial-gradient animate-pulse w-2/3" />
        </div>
      )}
      <p className="text-body-lg text-on-surface-variant font-serif italic">
        {status ? statusMessages[status] : "Connecting..."}
      </p>
      {error && (
        <p className="text-body-md text-error">{error}</p>
      )}
    </div>
  );
}
