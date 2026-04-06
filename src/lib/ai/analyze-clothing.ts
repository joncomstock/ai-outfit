import { updateJobStatus } from "@/lib/jobs/job-store";

export async function analyzeClothingImage(
  _itemId: string,
  _imageUrl: string,
  jobId: string
): Promise<void> {
  // Stub — implemented in Task 9
  updateJobStatus(jobId, "error", "Not implemented");
}
