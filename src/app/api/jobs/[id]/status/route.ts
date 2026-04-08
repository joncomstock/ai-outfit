import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getJob, subscribeToJob, type JobStatus } from "@/lib/jobs/job-store";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 3_000; // 3 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const job = await getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // If already terminal, send one event and close
  if (job.status === "ready" || job.status === "error") {
    const data = JSON.stringify({ status: job.status, error: job.error ?? undefined });
    const body = `data: ${data}\n\n`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(pollTimer);
        clearTimeout(timeoutTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const send = (status: JobStatus, error?: string) => {
        if (closed) return;
        const data = JSON.stringify({ status, error });
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          close();
          return;
        }
        if (status === "ready" || status === "error") {
          close();
        }
      };

      // Send current status immediately
      send(job.status, job.error ?? undefined);

      // Subscribe for in-memory updates (same-instance)
      const unsubscribe = subscribeToJob(jobId, send);

      // Poll DB every 3s as cross-instance fallback
      const pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const freshJob = await getJob(jobId);
          if (freshJob) {
            send(freshJob.status as JobStatus, freshJob.error ?? undefined);
          }
        } catch {
          // Ignore poll errors
        }
      }, POLL_INTERVAL_MS);

      // Timeout after 5 minutes
      const timeoutTimer = setTimeout(() => {
        if (!closed) {
          send("error", "Job status polling timed out");
        }
      }, TIMEOUT_MS);

      // Clean up on client disconnect
      req.signal.addEventListener("abort", () => {
        close();
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
