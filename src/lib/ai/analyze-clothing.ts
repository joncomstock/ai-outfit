import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { closetItemsTable } from "@/db/schema/closet-items";
import { usersTable } from "@/db/schema/users";
import { updateJobStatus } from "@/lib/jobs/job-store";
import { validateClothingAnalysis } from "./validate-response";

const anthropic = new Anthropic();

interface AnalysisResult {
  category: string;
  subCategory: string;
  colors: string[];
  fit: "slim" | "regular" | "relaxed" | "oversized";
  seasonality: string[];
  styleTags: string[];
}

const SYSTEM_PROMPT = `You are a fashion analysis AI. Analyze the clothing item in the image and return a JSON object with these exact fields:

{
  "category": "tops" | "bottoms" | "shoes" | "outerwear" | "accessories",
  "subCategory": string (e.g., "t-shirt", "blazer", "sneakers", "jeans"),
  "colors": string[] (array of hex color values, dominant color first, max 4),
  "fit": "slim" | "regular" | "relaxed" | "oversized",
  "seasonality": string[] (subset of ["spring", "summer", "fall", "winter"]),
  "styleTags": string[] (up to 8 descriptive tags like "casual", "formal", "streetwear", "bohemian", "minimal", "vintage", "sporty", "elegant")
}

Return ONLY valid JSON, no markdown fences, no explanation.`;

export async function analyzeClothingImage(
  itemId: string,
  imageUrl: string,
  jobId: string
): Promise<void> {
  try {
    await updateJobStatus(jobId, "analyzing");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Analyze this clothing item.",
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    const validation = validateClothingAnalysis(parsed);
    if (!validation.valid) {
      throw new Error(`AI response validation failed: ${validation.error}`);
    }
    const result: AnalysisResult = parsed;

    await updateJobStatus(jobId, "detecting_colors");

    await db
      .update(closetItemsTable)
      .set({
        status: "ready",
        category: result.category,
        subCategory: result.subCategory,
        colors: result.colors,
        fit: result.fit,
        seasonality: result.seasonality,
        styleTags: result.styleTags,
        aiRawResponse: result,
      })
      .where(eq(closetItemsTable.id, itemId));

    // Update onboarding state if this is the first processed item
    const updatedItems = await db
      .select()
      .from(closetItemsTable)
      .where(eq(closetItemsTable.id, itemId));
    if (updatedItems.length > 0) {
      const itemUserId = updatedItems[0].userId;
      const user = await db.query.users.findFirst({
        where: eq(usersTable.id, itemUserId),
      });
      if (user && user.onboardingState === "first_upload") {
        await db
          .update(usersTable)
          .set({ onboardingState: "first_processed" })
          .where(eq(usersTable.id, itemUserId));
      }
    }

    await updateJobStatus(jobId, "ready");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await db
      .update(closetItemsTable)
      .set({ status: "error" })
      .where(eq(closetItemsTable.id, itemId))
      .catch(() => {});

    await updateJobStatus(jobId, "error", message);
  }
}
