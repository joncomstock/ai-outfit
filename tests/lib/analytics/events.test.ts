/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackEvent,
  trackOutfitGenerated,
  trackItemUploaded,
  trackAffiliateClick,
  trackTrendSaved,
} from "@/lib/analytics/events";

describe("analytics events", () => {
  const mockCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).posthog = { capture: mockCapture };
  });

  it("trackEvent calls posthog.capture with name and properties", () => {
    trackEvent("test_event", { key: "value" });
    expect(mockCapture).toHaveBeenCalledWith("test_event", { key: "value" });
  });

  it("trackEvent does nothing when posthog is not available", () => {
    delete (window as any).posthog;
    trackEvent("test_event");
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("trackOutfitGenerated sends mode", () => {
    trackOutfitGenerated("for_you");
    expect(mockCapture).toHaveBeenCalledWith("outfit_generated", { mode: "for_you" });
  });

  it("trackItemUploaded fires event", () => {
    trackItemUploaded();
    expect(mockCapture).toHaveBeenCalledWith("item_uploaded", undefined);
  });

  it("trackAffiliateClick sends productId", () => {
    trackAffiliateClick("prod-123");
    expect(mockCapture).toHaveBeenCalledWith("affiliate_click", { productId: "prod-123" });
  });

  it("trackTrendSaved sends trendId", () => {
    trackTrendSaved("trend-456");
    expect(mockCapture).toHaveBeenCalledWith("trend_saved", { trendId: "trend-456" });
  });
});
