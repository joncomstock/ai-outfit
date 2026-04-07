"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MeasurementsForm } from "@/components/fit/measurements-form";
import { useToast } from "@/components/ui/toast";

interface Measurements {
  heightCm: number | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  shouldersCm: number | null;
  inseamCm: number | null;
}

interface FitProfileClientProps {
  profile: Measurements & { brandFitNotes: Record<string, string> };
}

export function FitProfileClient({ profile }: FitProfileClientProps) {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurements>({
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    chestCm: profile.chestCm,
    waistCm: profile.waistCm,
    hipsCm: profile.hipsCm,
    shouldersCm: profile.shouldersCm,
    inseamCm: profile.inseamCm,
  });
  const [brandFitNotes, setBrandFitNotes] = useState(profile.brandFitNotes);
  const [saving, setSaving] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const fitPreferenceOptions = ["Slim Fit", "Regular", "Relaxed", "Oversized"];

  const togglePreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/fit-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...measurements, brandFitNotes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast("Fit profile saved", "success");
    } catch {
      toast("Failed to save fit profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-12">
        <span className="label-text text-on-surface-variant tracking-widest mb-3 block">FIT INTELLIGENCE</span>
        <h1 className="font-serif text-display-sm text-on-surface">Your Fit Profile</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mt-4">
          Help our AI understand your body and fit preferences for more personalized outfit recommendations.
        </p>
      </div>

      {/* Measurements */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <MeasurementsForm value={measurements} onChange={setMeasurements} />
      </section>

      {/* Brand fit notes */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <p className="label-text text-on-surface-variant tracking-widest mb-4">BRAND-SPECIFIC FIT NOTES</p>
        <p className="text-body-md text-on-surface-variant mb-6">
          Record how specific brands fit you. This helps the AI recommend the right size when suggesting products.
        </p>
        {Object.entries(brandFitNotes).length > 0 ? (
          <div className="flex flex-col gap-3">
            {Object.entries(brandFitNotes).map(([brand, note]) => (
              <div key={brand} className="flex items-center justify-between py-3 border-b border-outline-variant/10">
                <div>
                  <p className="text-body-lg text-on-surface font-sans font-semibold">{brand}</p>
                  <p className="text-body-md text-on-surface-variant">{note}</p>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...brandFitNotes };
                    delete updated[brand];
                    setBrandFitNotes(updated);
                  }}
                  className="text-body-md text-error hover:underline"
                  aria-label={`Remove ${brand} fit note`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-md text-on-surface-variant italic">
            No brand-specific fit notes yet. Use the fit feedback modal when viewing outfit items to add notes.
          </p>
        )}
      </section>

      {/* Fit Recommendations */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <div className="bg-primary text-on-primary p-5 md:p-8">
          <p className="label-text tracking-widest mb-4 opacity-80">FIT RECOMMENDATIONS</p>
          <ul className="space-y-3 text-body-lg">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 bg-on-primary shrink-0" />
              Structured shoulders complement your frame
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 bg-on-primary shrink-0" />
              Mid-rise waistlines create balanced proportions
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 bg-on-primary shrink-0" />
              Extended cuffs add visual length
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 bg-on-primary shrink-0" />
              Monochromatic layering creates a streamlined silhouette
            </li>
          </ul>
        </div>
      </section>

      {/* Fit Preferences */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <p className="label-text text-on-surface-variant tracking-widest mb-4">FIT PREFERENCES</p>
        <p className="text-body-md text-on-surface-variant mb-6">
          Select your preferred fit styles. This helps the AI tailor outfit suggestions to your comfort.
        </p>
        <div className="flex flex-wrap gap-3">
          {fitPreferenceOptions.map((pref) => (
            <button
              key={pref}
              onClick={() => togglePreference(pref)}
              className={`label-text px-6 py-3 border transition-colors duration-150 ${
                selectedPreferences.includes(pref)
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-transparent text-on-surface border-outline-variant/30 hover:border-on-surface"
              }`}
            >
              {pref.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "SAVE FIT PROFILE"}
        </Button>
      </div>
    </div>
  );
}
