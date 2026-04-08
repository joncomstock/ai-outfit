"use client";

import { useState } from "react";

interface Props {
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  usage: {
    generationsUsed: number;
    generationsLimit: number;
    isPremium: boolean;
  };
}

export function SubscriptionClient({
  subscriptionStatus,
  stripeCustomerId,
  usage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const isPremium = subscriptionStatus === "premium";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-display-sm text-on-surface mb-8">
        Subscription
      </h1>

      {/* Current Plan */}
      <section className="bg-surface-container p-6 mb-6">
        <p className="label-text text-on-surface-variant mb-2">Current Plan</p>
        <p className="font-serif text-headline-md text-on-surface">
          {isPremium ? "Premium" : "Free"}
        </p>
      </section>

      {/* Usage */}
      <section className="bg-surface-container p-6 mb-6">
        <p className="label-text text-on-surface-variant mb-2">
          Monthly Usage
        </p>
        <p className="font-serif text-headline-sm text-on-surface">
          {usage.generationsUsed}{" "}
          {isPremium ? "" : `/ ${usage.generationsLimit}`} outfit generations
        </p>
        {!isPremium && (
          <div className="mt-3 bg-surface-container-high h-2 overflow-hidden">
            <div
              className="h-full editorial-gradient transition-all"
              style={{
                width: `${Math.min(100, (usage.generationsUsed / usage.generationsLimit) * 100)}%`,
              }}
            />
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="bg-surface-container p-6">
        {isPremium ? (
          <div>
            <p className="text-body-lg text-on-surface mb-4">
              Manage your billing, update payment method, or cancel your
              subscription through Stripe.
            </p>
            <button
              onClick={handleManage}
              disabled={loading}
              className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-body-lg text-on-surface mb-2">
              Upgrade to Premium for unlimited outfit generations, capsule
              wardrobes, and priority support.
            </p>
            <ul className="text-body-md text-on-surface-variant mb-4 space-y-1">
              <li>Unlimited outfit generations</li>
              <li>Capsule wardrobe generator</li>
              <li>Advanced style analytics</li>
              <li>Priority AI processing</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="editorial-gradient px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Loading..." : "Upgrade to Premium"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
