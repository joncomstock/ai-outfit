/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackFunnelStep,
  FUNNEL_STEPS,
  trackSignup,
  trackFirstUpload,
  trackFirstProcessed,
  trackFirstOutfit,
  trackFirstShare,
} from "@/lib/analytics/funnel";

describe("conversion funnel", () => {
  const mockCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).posthog = { capture: mockCapture };
  });

  it("FUNNEL_STEPS has correct ordered steps", () => {
    expect(FUNNEL_STEPS).toEqual([
      "signup",
      "first_upload",
      "first_processed",
      "first_outfit",
      "first_share",
    ]);
  });

  it("trackFunnelStep sends funnel event with step and index", () => {
    trackFunnelStep("first_upload");
    expect(mockCapture).toHaveBeenCalledWith("funnel_step", {
      step: "first_upload",
      stepIndex: 1,
      funnel: "activation",
    });
  });

  it("trackSignup sends signup funnel step", () => {
    trackSignup();
    expect(mockCapture).toHaveBeenCalledWith("funnel_step", {
      step: "signup",
      stepIndex: 0,
      funnel: "activation",
    });
  });

  it("trackFirstOutfit sends first_outfit funnel step", () => {
    trackFirstOutfit();
    expect(mockCapture).toHaveBeenCalledWith("funnel_step", {
      step: "first_outfit",
      stepIndex: 3,
      funnel: "activation",
    });
  });

  it("trackFirstShare sends first_share funnel step", () => {
    trackFirstShare();
    expect(mockCapture).toHaveBeenCalledWith("funnel_step", {
      step: "first_share",
      stepIndex: 4,
      funnel: "activation",
    });
  });
});
