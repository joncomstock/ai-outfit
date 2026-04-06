import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getJob, subscribeToJob, type JobStatus } from "@/lib/jobs/job-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (status: JobStatus, error?: string) => {
        const data = JSON.stringify({ status, error });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        if (status === "ready" || status === "error") {
          controller.close();
        }
      };

      // Send current status immediately
      send(job.status, job.error);

      // If already terminal, we're done
      if (job.status === "ready" || job.status === "error") return;

      // Subscribe to updates
      const unsubscribe = subscribeToJob(jobId, send);

      // Clean up on client disconnect
      req.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
