import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerProvider,
  getProvider,
  getAllProviders,
  clearProviders,
} from "@/lib/affiliates/registry";
import type { AffiliateProvider } from "@/lib/affiliates/types";

const mockProvider: AffiliateProvider = {
  name: "test-provider",
  searchProducts: vi.fn().mockResolvedValue([]),
  getProduct: vi.fn().mockResolvedValue(null),
};

describe("affiliate provider registry", () => {
  beforeEach(() => {
    clearProviders();
  });

  it("registers and retrieves a provider by name", () => {
    registerProvider(mockProvider);
    const result = getProvider("test-provider");
    expect(result).toBe(mockProvider);
  });

  it("returns undefined for unregistered provider", () => {
    const result = getProvider("nonexistent");
    expect(result).toBeUndefined();
  });

  it("lists all registered providers", () => {
    const provider2: AffiliateProvider = {
      name: "provider-2",
      searchProducts: vi.fn().mockResolvedValue([]),
      getProduct: vi.fn().mockResolvedValue(null),
    };
    registerProvider(mockProvider);
    registerProvider(provider2);
    expect(getAllProviders()).toHaveLength(2);
  });

  it("overwrites provider with same name", () => {
    const updated: AffiliateProvider = {
      ...mockProvider,
      searchProducts: vi.fn().mockResolvedValue([{ name: "updated" }]),
    };
    registerProvider(mockProvider);
    registerProvider(updated);
    expect(getProvider("test-provider")).toBe(updated);
    expect(getAllProviders()).toHaveLength(1);
  });
});
