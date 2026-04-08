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
