import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!POSTHOG_KEY) {
    console.warn("[analytics] NEXT_PUBLIC_POSTHOG_KEY not set — skipping PostHog init");
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });

  // Expose for event helpers
  (window as any).posthog = posthog;
  initialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).posthog) {
    (window as any).posthog.identify(userId, traits);
  }
}

export function resetPostHog() {
  if (typeof window !== "undefined" && (window as any).posthog) {
    (window as any).posthog.reset();
  }
}
