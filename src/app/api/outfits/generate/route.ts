import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { createJob } from "@/lib/jobs/job-store";
import { generateOutfit } from "@/lib/ai/generate-outfit";
import { canGenerate, recordUsage } from "@/lib/billing/gates";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const allowed = await canGenerate(dbUserId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Monthly generation limit reached. Upgrade to Premium for unlimited generations." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const mode = body.mode as "for_you" | "style_this" | "trend_based";
  const sourceItemId = body.sourceItemId as string | undefined;
  const trendId = body.trendId as string | undefined;

  if (!mode || !["for_you", "style_this", "trend_based"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  if (mode === "style_this" && !sourceItemId) {
    return NextResponse.json({ error: "sourceItemId required for style_this mode" }, { status: 400 });
  }
  if (mode === "trend_based" && !trendId) {
    return NextResponse.json({ error: "trendId required for trend_based mode" }, { status: 400 });
  }

  // Reserve usage atomically BEFORE starting the job to prevent concurrent limit bypass
  await recordUsage(dbUserId, "outfit_generation");

  const jobId = await createJob();
  generateOutfit({ userId: dbUserId, mode, sourceItemId, trendId, jobId })
    .catch(console.error);

  return NextResponse.json({ jobId }, { status: 202 });
}
