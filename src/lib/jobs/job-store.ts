export type JobStatus =
  | "queued"
  | "uploading"
  | "analyzing"
  | "detecting_colors"
  | "detecting_fit"
  | "ready"
  | "error";

interface Job {
  id: string;
  itemId: string;
  status: JobStatus;
  error?: string;
  listeners: Set<(status: JobStatus, error?: string) => void>;
}

const jobs = new Map<string, Job>();

export function createJob(itemId: string): string {
  const id = crypto.randomUUID();
  jobs.set(id, { id, itemId, status: "queued", listeners: new Set() });
  return id;
}

export function updateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string
) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = status;
  if (error) job.error = error;
  for (const listener of job.listeners) {
    listener(status, error);
  }
  if (status === "ready" || status === "error") {
    setTimeout(() => jobs.delete(jobId), 60_000);
  }
}

export function getJob(jobId: string) {
  return jobs.get(jobId) ?? null;
}

export function subscribeToJob(
  jobId: string,
  listener: (status: JobStatus, error?: string) => void
): () => void {
  const job = jobs.get(jobId);
  if (!job) return () => {};
  job.listeners.add(listener);
  return () => job.listeners.delete(listener);
}
