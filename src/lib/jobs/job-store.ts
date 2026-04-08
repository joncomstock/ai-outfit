import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobsTable } from "@/db/schema/jobs";

export type JobStatus =
  | "queued"
  | "uploading"
  | "analyzing"
  | "detecting_colors"
  | "detecting_fit"
  | "generating"
  | "ready"
  | "error";

// In-memory listeners for SSE (per-instance only)
const listeners = new Map<string, Set<(status: JobStatus, error?: string) => void>>();

export async function createJob(itemId?: string): Promise<string> {
  const [job] = await db
    .insert(jobsTable)
    .values({ itemId: itemId ?? null })
    .returning();
  return job.id;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string
): Promise<void> {
  await db
    .update(jobsTable)
    .set({ status, error: error ?? null })
    .where(eq(jobsTable.id, jobId));

  const jobListeners = listeners.get(jobId);
  if (jobListeners) {
    for (const listener of jobListeners) {
      listener(status, error);
    }
    if (status === "ready" || status === "error") {
      listeners.delete(jobId);
    }
  }
}

export async function getJob(jobId: string) {
  return (
    (await db.query.jobs.findFirst({
      where: eq(jobsTable.id, jobId),
    })) ?? null
  );
}

export function subscribeToJob(
  jobId: string,
  listener: (status: JobStatus, error?: string) => void
): () => void {
  if (!listeners.has(jobId)) {
    listeners.set(jobId, new Set());
  }
  listeners.get(jobId)!.add(listener);
  return () => {
    const set = listeners.get(jobId);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(jobId);
    }
  };
}
