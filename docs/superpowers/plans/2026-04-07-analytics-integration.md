# Analytics Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive analytics: Vercel Analytics for web vitals, PostHog for product event tracking, instrumentation of key user actions, and a conversion funnel tracking signup-to-share journey.

**Architecture:** Vercel Analytics and Speed Insights are drop-in components in the root layout. PostHog runs client-side via a provider component wrapping the app. Event tracking functions are typed helpers that call `posthog.capture()`. Funnel tracking hooks into existing API endpoints and state transitions to record progression steps.

**Tech Stack:** Next.js 16 App Router, `@vercel/analytics`, `@vercel/speed-insights`, `posthog-js`, Drizzle ORM, Neon Postgres

---

## File Structure

```
src/
├── lib/
│   └── analytics/
│       ├── posthog.ts                              # NEW: PostHog client init
│       ├── events.ts                               # NEW: Typed event tracking functions
│       └── funnel.ts                               # NEW: Conversion funnel step tracking
├── components/
│   └── analytics/
│       └── posthog-provider.tsx                    # NEW: Client-side PostHog provider
├── app/
│   └── layout.tsx                                  # MODIFY: Add Analytics, SpeedInsights, PostHogProvider
├── .env.local.example                              # MODIFY: Add NEXT_PUBLIC_POSTHOG_KEY
tests/
├── lib/
│   └── analytics/
│       ├── events.test.ts                          # NEW
│       └── funnel.test.ts                          # NEW
```

---

## Task 1: Vercel Analytics + Web Vitals

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `.env.local.example` (if exists)

- [ ] **Step 1: Install packages**

Run:
```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 2: Add Analytics and SpeedInsights to root layout**

`src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Outfit Engine", template: "%s | Outfit Engine" },
  description:
    "Your AI stylist — turn your closet into a personal styling engine",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://outfitengine.com",
  ),
  openGraph: {
    type: "website",
    siteName: "Outfit Engine",
    title: "Outfit Engine — Your AI Stylist",
    description:
      "Upload your wardrobe. Get styled by AI. Shop the missing pieces.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
        <body>
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: No errors. Analytics components render in the root layout.

**Commit:** `feat: add Vercel Analytics and Speed Insights to root layout`

---

## Task 2: PostHog Event Tracking

**Files:**
- Create: `src/lib/analytics/posthog.ts`
- Create: `src/lib/analytics/events.ts`
- Create: `src/components/analytics/posthog-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `.env.local.example`
- Test: `tests/lib/analytics/events.test.ts`

- [ ] **Step 1: Install PostHog**

Run:
```bash
pnpm add posthog-js
```

- [ ] **Step 2: Write failing tests for event tracking**

`tests/lib/analytics/events.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/analytics/events.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 4: Create PostHog client init**

`src/lib/analytics/posthog.ts`:
```typescript
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
```

- [ ] **Step 5: Create typed event tracking functions**

`src/lib/analytics/events.ts`:
```typescript
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).posthog) {
    (window as any).posthog.capture(name, properties);
  }
}

export const trackOutfitGenerated = (mode: string) =>
  trackEvent("outfit_generated", { mode });

export const trackItemUploaded = () =>
  trackEvent("item_uploaded");

export const trackAffiliateClick = (productId: string) =>
  trackEvent("affiliate_click", { productId });

export const trackTrendSaved = (trendId: string) =>
  trackEvent("trend_saved", { trendId });
```

- [ ] **Step 6: Create PostHog provider component**

`src/components/analytics/posthog-provider.tsx`:
```typescript
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { initPostHog, identifyUser, resetPostHog } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      identifyUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
      });
    } else {
      resetPostHog();
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
```

- [ ] **Step 7: Add PostHogProvider to root layout**

Update `src/app/layout.tsx` to wrap children with the provider. The body should become:

```typescript
<body>
  <PostHogProvider>
    {children}
  </PostHogProvider>
  <Analytics />
  <SpeedInsights />
</body>
```

Add import: `import { PostHogProvider } from "@/components/analytics/posthog-provider";`

- [ ] **Step 8: Add env var to .env.local.example**

Append to `.env.local.example`:
```
NEXT_PUBLIC_POSTHOG_KEY                # PostHog project API key
NEXT_PUBLIC_POSTHOG_HOST               # PostHog instance URL (optional, defaults to https://us.i.posthog.com)
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/analytics/events.test.ts`
Expected: PASS — all 6 tests

**Commit:** `feat: add PostHog event tracking with typed events and provider component`

---

## Task 3: Instrument Key User Actions

**Files:**
- Modify: `src/components/closet/upload-modal.tsx`
- Modify: `src/app/(auth)/outfits/client.tsx` (or generation modal)
- Modify: `src/components/catalog/product-detail-modal.tsx` (or equivalent)
- Modify: `src/app/(auth)/trends/[id]/client.tsx` (or bookmark component)

- [ ] **Step 1: Add trackItemUploaded to upload modal**

In the upload modal's success handler (after the API returns success), add:

```typescript
import { trackItemUploaded } from "@/lib/analytics/events";

// Inside the success callback after upload completes:
trackItemUploaded();
```

- [ ] **Step 2: Add trackOutfitGenerated to generation flow**

In the outfit generation client component, after receiving the completed outfit from SSE/polling:

```typescript
import { trackOutfitGenerated } from "@/lib/analytics/events";

// Inside the success callback after outfit generation completes:
trackOutfitGenerated(mode); // "for_you" | "style_this" | "trend_based"
```

- [ ] **Step 3: Add trackAffiliateClick to Shop Now button**

In the product detail modal or product card Shop Now link handler:

```typescript
import { trackAffiliateClick } from "@/lib/analytics/events";

// Inside the Shop Now click handler, before or after the affiliate click API call:
trackAffiliateClick(product.id);
```

- [ ] **Step 4: Add trackTrendSaved to bookmark button**

In the trend detail page's save/bookmark handler:

```typescript
import { trackTrendSaved } from "@/lib/analytics/events";

// Inside the save handler after successful API call:
trackTrendSaved(trendId);
```

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: No errors.

**Commit:** `feat: instrument key user actions with PostHog event tracking`

---

## Task 4: Conversion Funnel

**Files:**
- Create: `src/lib/analytics/funnel.ts`
- Test: `tests/lib/analytics/funnel.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/analytics/funnel.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/analytics/funnel.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create funnel tracking module**

`src/lib/analytics/funnel.ts`:
```typescript
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
```

- [ ] **Step 4: Wire funnel into existing flows**

Add `trackSignup()` call in `src/lib/auth/ensure-user.ts` — after successful user creation (not on re-fetch):

```typescript
import { trackSignup } from "@/lib/analytics/funnel";

// After the insert().returning() succeeds and user is defined:
// Note: This runs server-side so won't fire PostHog directly.
// Instead, return a flag and track client-side, or use PostHog server SDK.
// For simplicity, add client-side tracking in the PostHogProvider when user first loads.
```

Better approach — track funnel steps client-side based on onboarding state transitions. In `src/components/analytics/posthog-provider.tsx`, after identifying the user, check their onboarding state and fire the appropriate funnel step if it's a new transition. This avoids server-side PostHog calls.

Add to the upload modal success handler:
```typescript
import { trackFirstUpload } from "@/lib/analytics/funnel";
// After trackItemUploaded():
trackFirstUpload();
```

Add to the analyze-clothing completion callback (in the processing status component when status changes to "ready"):
```typescript
import { trackFirstProcessed } from "@/lib/analytics/funnel";
trackFirstProcessed();
```

Add to the outfit generation success handler:
```typescript
import { trackFirstOutfit } from "@/lib/analytics/funnel";
// After trackOutfitGenerated():
trackFirstOutfit();
```

Add to the share button success handler:
```typescript
import { trackFirstShare } from "@/lib/analytics/funnel";
trackFirstShare();
```

Note: These fire on every occurrence, not just the first. PostHog's funnel analysis handles deduplication — it looks at the first occurrence of each step per user. This is simpler than tracking state client-side.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/analytics/funnel.test.ts`
Expected: PASS — all 5 tests

- [ ] **Step 6: Verify full test suite**

Run: `pnpm vitest run tests/lib/analytics/`
Expected: PASS — all analytics tests green

**Commit:** `feat: add conversion funnel tracking for signup-to-share activation flow`
