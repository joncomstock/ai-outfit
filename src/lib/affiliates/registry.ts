import type { AffiliateProvider } from "./types";

const providers = new Map<string, AffiliateProvider>();

export function registerProvider(provider: AffiliateProvider) {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): AffiliateProvider | undefined {
  return providers.get(name);
}

export function getAllProviders(): AffiliateProvider[] {
  return Array.from(providers.values());
}

export function clearProviders() {
  providers.clear();
}
