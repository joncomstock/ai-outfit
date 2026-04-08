"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradePrompt({ isOpen, onClose, reason }: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface z-10 max-w-md w-full mx-4 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 className="font-serif text-headline-md text-on-surface mb-2">
          Upgrade to Premium
        </h2>
        {reason && (
          <p className="text-body-lg text-on-surface-variant mb-4">
            {reason}
          </p>
        )}

        <ul className="text-body-md text-on-surface space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Unlimited outfit generations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            AI capsule wardrobe generator
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Advanced style analytics
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">&#10003;</span>
            Priority AI processing
          </li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="editorial-gradient flex-1 px-6 py-3 text-white text-label-lg uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Loading..." : "Upgrade Now"}
          </button>
          <button
            onClick={onClose}
            className="bg-surface-container-high flex-1 px-6 py-3 text-on-surface text-label-lg uppercase tracking-widest"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
