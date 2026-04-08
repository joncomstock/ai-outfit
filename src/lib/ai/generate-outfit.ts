import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { trendsTable } from "@/db/schema/trends";
import { closetItemsTable } from "@/db/schema/closet-items";
import { outfitsTable, outfitSlotsTable } from "@/db/schema/outfits";
import { updateJobStatus } from "@/lib/jobs/job-store";
import { validateOutfitResult } from "./validate-response";

const anthropic = new Anthropic();

export interface GenerateOptions {
  userId: string;
  mode: "for_you" | "style_this" | "trend_based";
  sourceItemId?: string;
  trendId?: string;
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
  const { userId, mode, sourceItemId, trendId, jobId } = options;

  try {
    await updateJobStatus(jobId, "analyzing");

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

    // Validate required wardrobe categories
    const categories = new Set(closetItems.map((item) => item.category));
    const hasTop = categories.has("tops");
    const hasBottom = categories.has("bottoms");
    const hasShoes = categories.has("shoes");

    if (!hasTop || !hasBottom || !hasShoes) {
      const missing = [
        !hasTop && "tops",
        !hasBottom && "bottoms",
        !hasShoes && "shoes",
      ].filter(Boolean);
      throw new Error(
        `Missing required wardrobe categories: ${missing.join(", ")}. Upload at least one item in each category.`
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

    // Fetch trend context if trend_based mode
    let trendContext = "";
    if (mode === "trend_based" && trendId) {
      const trend = await db.query.trends.findFirst({
        where: eq(trendsTable.id, trendId),
      });
      if (trend) {
        const trendTags = Array.isArray(trend.styleTags) ? trend.styleTags.join(", ") : "";
        trendContext = `\n## Trend Inspiration: ${trend.name}\nDescription: ${trend.description}\nCategory: ${trend.category}\nStyle Tags: ${trendTags}\n\nBuild an outfit that embodies this trend aesthetic using the user's wardrobe items.`;
      }
    }

    const taskLine =
      mode === "style_this" && sourceItemId
        ? `Build a complete outfit around item ${sourceItemId}`
        : mode === "trend_based"
          ? `Create an outfit inspired by the trend described below.${trendContext}`
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
    const parsed = JSON.parse(text);
    const validation = validateOutfitResult(parsed);
    if (!validation.valid) {
      throw new Error(`AI response validation failed: ${validation.error}`);
    }
    const result: ClaudeOutfitResult = parsed;

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
        generationMode: mode,
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

    await updateJobStatus(jobId, "ready");
    return outfitId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await updateJobStatus(jobId, "error", message);
    return null;
  }
}
