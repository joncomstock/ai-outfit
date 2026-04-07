import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { closetItemsTable } from "@/db/schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { updateJobStatus } from "@/lib/jobs/job-store";

const anthropic = new Anthropic();

export interface GenerateOptions {
  userId: string;
  mode: "for_you" | "style_this";
  sourceItemId?: string;
  jobId: string;
}

interface OutfitSlotResult {
  slotType: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  closetItemId: string;
}

interface ClaudeOutfitResult {
  name: string;
  slots: OutfitSlotResult[];
}

const SYSTEM_PROMPT = `You are an expert fashion stylist AI. Compose a complete outfit from the user's wardrobe items. Return a JSON object with:

{
  "name": string (a creative editorial outfit name, 2-4 words, e.g., "The Autumn Essential", "Urban Minimalist", "Coastal Weekend"),
  "slots": [
    { "slotType": "top", "closetItemId": "<id>" },
    { "slotType": "bottom", "closetItemId": "<id>" },
    { "slotType": "shoes", "closetItemId": "<id>" },
    { "slotType": "outerwear", "closetItemId": "<id>" },
    { "slotType": "accessory", "closetItemId": "<id>" }
  ]
}

Rules:
- MUST include exactly one "top", one "bottom", and one "shoes" slot
- "outerwear" and "accessory" are optional — only include if it enhances the outfit
- Each closetItemId MUST be from the provided item list
- Never use the same item in multiple slots
- Consider color harmony, style coherence, seasonality, and fit compatibility
- The outfit name should be evocative and editorial

Return ONLY valid JSON, no markdown fences, no explanation.`;

export async function generateOutfit(
  options: GenerateOptions
): Promise<string | null> {
  const { userId, mode, sourceItemId, jobId } = options;

  try {
    updateJobStatus(jobId, "analyzing");

    // Fetch user preferences
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, userId),
    });

    // Fetch all ready closet items for the user
    const closetItems = await db
      .select()
      .from(closetItemsTable)
      .where(
        and(
          eq(closetItemsTable.userId, userId),
          eq(closetItemsTable.status, "ready")
        )
      );

    // Validate minimum item count
    if (closetItems.length < 3) {
      throw new Error(
        `Not enough wardrobe items to generate an outfit. Need at least 3 (top, bottom, shoes), found ${closetItems.length}.`
      );
    }

    // Build item list for Claude prompt
    const itemLines = closetItems
      .map((item) => {
        const colors = Array.isArray(item.colors) ? item.colors.join(", ") : "";
        const seasons = Array.isArray(item.seasonality)
          ? item.seasonality.join(", ")
          : "";
        const tags = Array.isArray(item.styleTags)
          ? item.styleTags.join(", ")
          : "";
        return `- ID: ${item.id} | ${item.category}/${item.subCategory} | colors: ${colors} | fit: ${item.fit} | seasons: ${seasons} | tags: ${tags}`;
      })
      .join("\n");

    const stylePrefs =
      user?.stylePreferences && Array.isArray(user.stylePreferences)
        ? user.stylePreferences.join(", ")
        : "no preferences set";
    const budget = user?.budgetRange ?? "mid";

    const taskLine =
      mode === "style_this" && sourceItemId
        ? `Build a complete outfit around item ${sourceItemId}`
        : "Create the best possible outfit from these items.";

    const userMessage = `## Wardrobe Items

${itemLines}

## Style Preferences: ${stylePrefs}
## Budget Range: ${budget}

## Task: ${taskLine}`;

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const result: ClaudeOutfitResult = JSON.parse(text);

    // Validate all referenced IDs belong to the user's items
    const userItemIds = new Set(closetItems.map((item) => item.id));
    for (const slot of result.slots) {
      if (!userItemIds.has(slot.closetItemId)) {
        throw new Error(
          `Claude referenced item ID ${slot.closetItemId} that does not belong to the user's wardrobe.`
        );
      }
    }

    // Validate required slots are present
    const slotTypes = result.slots.map((s) => s.slotType);
    if (
      !slotTypes.includes("top") ||
      !slotTypes.includes("bottom") ||
      !slotTypes.includes("shoes")
    ) {
      throw new Error(
        "Claude response is missing required slots: top, bottom, and shoes are all required."
      );
    }

    // Insert outfit record
    const [newOutfit] = await db
      .insert(outfitsTable)
      .values({
        userId,
        name: result.name,
        generationMode: mode === "style_this" ? "style_this" : "for_you",
        sourceItemId: sourceItemId ?? null,
        aiRawResponse: result,
      })
      .returning();

    const outfitId = newOutfit.id;

    // Insert outfit_slots records
    await db.insert(outfitSlotsTable).values(
      result.slots.map((slot, index) => ({
        outfitId,
        slotType: slot.slotType,
        closetItemId: slot.closetItemId,
        position: index,
      }))
    );

    // Update onboarding state if user is at "first_processed"
    if (user && user.onboardingState === "first_processed") {
      await db
        .update(usersTable)
        .set({ onboardingState: "first_outfit" })
        .where(eq(usersTable.id, userId));
    }

    updateJobStatus(jobId, "ready");
    return outfitId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    updateJobStatus(jobId, "error", message);
    return null;
  }
}
