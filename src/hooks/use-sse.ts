"use client";

import { useEffect, useState } from "react";
import type { JobStatus } from "@/lib/jobs/job-store";

interface SSEState {
  status: JobStatus | null;
  error: string | null;
  isConnected: boolean;
}

export function useSSE(jobId: string | null): SSEState {
  const [state, setState] = useState<SSEState>({
    status: null,
    error: null,
    isConnected: false,
  });

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/jobs/${jobId}/status`);
    setState((prev) => ({ ...prev, isConnected: true }));

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setState({
        status: data.status,
        error: data.error ?? null,
        isConnected: true,
      });
      if (data.status === "ready" || data.status === "error") {
        eventSource.close();
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return state;
}
