import Anthropic from "@anthropic-ai/sdk";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { closetItemsTable } from "@/db/schema/closet-items";

const anthropic = new Anthropic();

export interface CapsuleGenerateOptions {
  userId: string;
  season?: string;
  theme?: string;
}

interface OutfitSlot {
  slotType: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  closetItemId: string;
}

interface OutfitCombination {
  name: string;
  slots: OutfitSlot[];
}

interface GapItem {
  category: string;
  description: string;
  searchQuery: string;
}

export interface CapsuleResult {
  name: string;
  description: string;
  season: string;
  theme: string;
  selectedItems: string[];
  outfitCombinations: OutfitCombination[];
  gaps: GapItem[];
  rawResponse: unknown;
}

const SYSTEM_PROMPT = `You are an expert fashion stylist and wardrobe curator. Create a capsule wardrobe from the user's closet items.

Rules:
- Select 5-7 versatile pieces that maximize outfit combinations
- Each piece should work in at least 2 different outfits
- Consider color harmony, seasonal appropriateness, and style cohesion
- Identify 2-3 wardrobe gaps — items the user should acquire to expand versatility
- Only reference item IDs that exist in the provided list

Return a JSON object with exactly this shape:
{
  "name": "string — a descriptive capsule name",
  "description": "string — 1-2 sentences describing the capsule concept",
  "season": "string — primary season (spring, summer, fall, winter, all)",
  "theme": "string — style theme (casual, smart-casual, workwear, weekend, etc.)",
  "selectedItems": ["item-id-1", "item-id-2", ...],
  "outfitCombinations": [
    {
      "name": "string — outfit name",
      "slots": [
        { "slotType": "top|bottom|shoes|outerwear|accessory", "closetItemId": "item-id" }
      ]
    }
  ],
  "gaps": [
    { "category": "string", "description": "string — what and why", "searchQuery": "string — catalog search terms" }
  ]
}

Return ONLY valid JSON. No markdown, no explanation.`;

export async function generateCapsule(
  options: CapsuleGenerateOptions,
): Promise<CapsuleResult> {
  const { userId, season, theme } = options;

  // Fetch user's ready closet items
  const items = await db.query.closetItems.findMany({
    where: and(
      eq(closetItemsTable.userId, userId),
      eq(closetItemsTable.status, "ready"),
    ),
  });

  if (items.length < 5) {
    throw new Error("Need at least 5 items in your closet to generate a capsule wardrobe");
  }

  // Build item metadata for Claude
  const itemList = items.map((item) => ({
    id: item.id,
    category: item.category,
    subCategory: item.subCategory,
    colors: item.colors,
    fit: item.fit,
    seasonality: item.seasonality,
    styleTags: item.styleTags,
  }));

  const userMessage = [
    `Closet items (${items.length} total):`,
    JSON.stringify(itemList, null, 2),
    season ? `Preferred season: ${season}` : "",
    theme ? `Preferred theme: ${theme}` : "",
    "",
    "Create a capsule wardrobe from these items.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected Claude response type");
  }

  let parsed: CapsuleResult;
  try {
    parsed = JSON.parse(text.text);
  } catch {
    throw new Error("Failed to parse capsule generation response as JSON");
  }

  // Validate all selected item IDs belong to user
  const validIds = new Set(items.map((i) => i.id));
  parsed.selectedItems = parsed.selectedItems.filter((id) => validIds.has(id));
  for (const combo of parsed.outfitCombinations) {
    combo.slots = combo.slots.filter((s) => validIds.has(s.closetItemId));
  }

  parsed.rawResponse = response;

  return parsed;
}
