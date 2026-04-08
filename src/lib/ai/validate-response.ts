const VALID_CATEGORIES = ["tops", "bottoms", "shoes", "outerwear", "accessories"];
const VALID_FITS = ["slim", "regular", "relaxed", "oversized"];
const VALID_SLOT_TYPES = ["top", "bottom", "shoes", "outerwear", "accessory"];

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateClothingAnalysis(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Response is not an object" };
  }

  const obj = data as Record<string, unknown>;

  if (!VALID_CATEGORIES.includes(obj.category as string)) {
    return { valid: false, error: `Invalid category: ${obj.category}` };
  }
  if (typeof obj.subCategory !== "string" || obj.subCategory.length === 0) {
    return { valid: false, error: "Missing subCategory" };
  }
  if (!Array.isArray(obj.colors) || obj.colors.length === 0) {
    return { valid: false, error: "colors must be a non-empty array" };
  }
  if (!VALID_FITS.includes(obj.fit as string)) {
    return { valid: false, error: `Invalid fit: ${obj.fit}` };
  }
  if (!Array.isArray(obj.seasonality)) {
    return { valid: false, error: "seasonality must be an array" };
  }
  if (!Array.isArray(obj.styleTags)) {
    return { valid: false, error: "styleTags must be an array" };
  }

  return { valid: true };
}

export function validateOutfitResult(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Response is not an object" };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.length === 0) {
    return { valid: false, error: "Missing outfit name" };
  }
  if (!Array.isArray(obj.slots)) {
    return { valid: false, error: "slots must be an array" };
  }

  const slotTypes = (obj.slots as Array<Record<string, unknown>>).map((s) => s.slotType);
  if (!slotTypes.includes("top") || !slotTypes.includes("bottom") || !slotTypes.includes("shoes")) {
    return { valid: false, error: "Missing required slots: top, bottom, shoes" };
  }

  for (const slot of obj.slots as Array<Record<string, unknown>>) {
    if (!VALID_SLOT_TYPES.includes(slot.slotType as string)) {
      return { valid: false, error: `Invalid slot type: ${slot.slotType}` };
    }
    if (typeof slot.closetItemId !== "string") {
      return { valid: false, error: "Each slot must have a closetItemId string" };
    }
  }

  return { valid: true };
}
