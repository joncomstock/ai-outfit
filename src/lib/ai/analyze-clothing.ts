import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { closetItemsTable } from "@/db/schema/closet-items";
import { updateJobStatus } from "@/lib/jobs/job-store";

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
    updateJobStatus(jobId, "analyzing");

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
    const result: AnalysisResult = JSON.parse(text);

    updateJobStatus(jobId, "detecting_colors");

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

    updateJobStatus(jobId, "ready");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await db
      .update(closetItemsTable)
      .set({ status: "error" })
      .where(eq(closetItemsTable.id, itemId))
      .catch(() => {});

    updateJobStatus(jobId, "error", message);
  }
}
