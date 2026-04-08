import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { createJob, updateJobStatus } from "@/lib/jobs/job-store";
import { generateCapsule } from "@/lib/ai/generate-capsule";
import { db } from "@/db";
import { capsulesTable, capsuleOutfitsTable } from "@/db/schema/capsules";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { season, theme } = body as { season?: string; theme?: string };

  const jobId = createJob("capsule-generation");

  // Run generation asynchronously
  (async () => {
    try {
      updateJobStatus(jobId, "analyzing");

      const result = await generateCapsule({ userId: dbUserId, season, theme });

      // Save capsule to DB
      const [capsule] = await db
        .insert(capsulesTable)
        .values({
          userId: dbUserId,
          name: result.name,
          description: result.description,
          season: result.season,
          theme: result.theme,
          pieces: result.selectedItems,
          gapAnalysis: result.gaps,
          aiRawResponse: result.rawResponse,
        })
        .returning();

      // Create outfits for each combination and link them
      for (let i = 0; i < result.outfitCombinations.length; i++) {
        const combo = result.outfitCombinations[i];

        const [outfit] = await db
          .insert(outfitsTable)
          .values({
            userId: dbUserId,
            name: combo.name,
            generationMode: "for_you",
          })
          .returning();

        // Create outfit slots
        for (const slot of combo.slots) {
          await db.insert(outfitSlotsTable).values({
            outfitId: outfit.id,
            slotType: slot.slotType,
            closetItemId: slot.closetItemId,
            position: combo.slots.indexOf(slot),
          });
        }

        // Link outfit to capsule
        await db.insert(capsuleOutfitsTable).values({
          capsuleId: capsule.id,
          outfitId: outfit.id,
          position: i,
        });
      }

      updateJobStatus(jobId, "ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capsule generation failed";
      updateJobStatus(jobId, "error", message);
    }
  })().catch(console.error);

  return NextResponse.json({ jobId }, { status: 202 });
}
