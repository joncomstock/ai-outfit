import { trackEvent } from "./events";

export const FUNNEL_STEPS = [
  "signup",
  "first_upload",
  "first_processed",
  "first_outfit",
  "first_share",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export function trackFunnelStep(step: FunnelStep) {
  const stepIndex = FUNNEL_STEPS.indexOf(step);
  trackEvent("funnel_step", {
    step,
    stepIndex,
    funnel: "activation",
  });
}

export const trackSignup = () => trackFunnelStep("signup");
export const trackFirstUpload = () => trackFunnelStep("first_upload");
export const trackFirstProcessed = () => trackFunnelStep("first_processed");
export const trackFirstOutfit = () => trackFunnelStep("first_outfit");
export const trackFirstShare = () => trackFunnelStep("first_share");
