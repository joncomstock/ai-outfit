import { describe, it, expect } from "vitest";
import { validateClothingAnalysis, validateOutfitResult } from "@/lib/ai/validate-response";

describe("validateClothingAnalysis", () => {
  it("accepts valid analysis", () => {
    const result = validateClothingAnalysis({
      category: "tops",
      subCategory: "t-shirt",
      colors: ["#000000"],
      fit: "regular",
      seasonality: ["summer"],
      styleTags: ["casual"],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = validateClothingAnalysis({
      category: "hats",
      subCategory: "beanie",
      colors: ["#000"],
      fit: "regular",
      seasonality: ["winter"],
      styleTags: [],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid category");
  });

  it("rejects missing subCategory", () => {
    const result = validateClothingAnalysis({
      category: "tops",
      subCategory: "",
      colors: ["#000"],
      fit: "regular",
      seasonality: [],
      styleTags: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects empty colors array", () => {
    const result = validateClothingAnalysis({
      category: "tops",
      subCategory: "shirt",
      colors: [],
      fit: "regular",
      seasonality: [],
      styleTags: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid fit", () => {
    const result = validateClothingAnalysis({
      category: "tops",
      subCategory: "shirt",
      colors: ["#fff"],
      fit: "tight",
      seasonality: [],
      styleTags: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(validateClothingAnalysis(null).valid).toBe(false);
    expect(validateClothingAnalysis("string").valid).toBe(false);
  });
});

describe("validateOutfitResult", () => {
  it("accepts valid outfit with required slots", () => {
    const result = validateOutfitResult({
      name: "Urban Chic",
      slots: [
        { slotType: "top", closetItemId: "id-1" },
        { slotType: "bottom", closetItemId: "id-2" },
        { slotType: "shoes", closetItemId: "id-3" },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing required slots", () => {
    const result = validateOutfitResult({
      name: "Test Outfit",
      slots: [{ slotType: "top", closetItemId: "id-1" }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required slots");
  });

  it("rejects missing outfit name", () => {
    const result = validateOutfitResult({
      name: "",
      slots: [
        { slotType: "top", closetItemId: "id-1" },
        { slotType: "bottom", closetItemId: "id-2" },
        { slotType: "shoes", closetItemId: "id-3" },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid slot type", () => {
    const result = validateOutfitResult({
      name: "Test",
      slots: [
        { slotType: "top", closetItemId: "id-1" },
        { slotType: "bottom", closetItemId: "id-2" },
        { slotType: "shoes", closetItemId: "id-3" },
        { slotType: "hat", closetItemId: "id-4" },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects slot without closetItemId", () => {
    const result = validateOutfitResult({
      name: "Test",
      slots: [
        { slotType: "top", closetItemId: "id-1" },
        { slotType: "bottom", closetItemId: "id-2" },
        { slotType: "shoes" },
      ],
    });
    expect(result.valid).toBe(false);
  });
});
