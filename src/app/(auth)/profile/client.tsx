"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StylePreferencesEditor } from "@/components/profile/style-preferences-editor";
import { SizeEditor } from "@/components/profile/size-editor";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { useToast } from "@/components/ui/toast";

interface ProfileUser {
  id: string;
  email: string;
  displayName: string;
  stylePreferences: string[];
  sizes: Record<string, string>;
  budgetRange: string;
}

interface ProfileClientProps {
  user: ProfileUser;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [stylePreferences, setStylePreferences] = useState<string[]>(user.stylePreferences);
  const [sizes, setSizes] = useState<Record<string, string>>(user.sizes);
  const [budgetRange, setBudgetRange] = useState(user.budgetRange);
  const [saving, setSaving] = useState(false);

  // Notification preferences (stored client-side for now, will be persisted in Task 6)
  const [emailOutfitReady, setEmailOutfitReady] = useState(true);
  const [emailTrendAlert, setEmailTrendAlert] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, stylePreferences, sizes, budgetRange }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast("Profile saved", "success");
    } catch {
      toast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (key: string, value: boolean) => {
    if (key === "emailOutfitReady") setEmailOutfitReady(value);
    if (key === "emailTrendAlert") setEmailTrendAlert(value);
    if (key === "emailWeeklyDigest") setEmailWeeklyDigest(value);
  };

  return (
    <div>
      <div className="mb-12">
        <span className="label-text text-on-surface-variant tracking-widest mb-3 block">ACCOUNT</span>
        <h1 className="font-serif text-display-sm text-on-surface">Your Profile</h1>
      </div>

      {/* Basic info */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email" value={user.email} disabled />
        </div>
      </section>

      {/* Budget range */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <p className="label-text text-on-surface-variant tracking-widest mb-4">BUDGET RANGE</p>
        <div className="flex gap-3" role="radiogroup" aria-label="Budget range">
          {(["budget", "mid", "luxury"] as const).map((range) => (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={budgetRange === range}
              onClick={() => setBudgetRange(range)}
              className={`px-6 py-2 text-body-md font-sans transition-colors duration-150 ${
                budgetRange === range
                  ? "editorial-gradient text-on-primary"
                  : "ghost-border text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {range === "budget" ? "Budget-Friendly" : range === "mid" ? "Mid-Range" : "Luxury"}
            </button>
          ))}
        </div>
      </section>

      {/* Style preferences */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <StylePreferencesEditor value={stylePreferences} onChange={setStylePreferences} />
      </section>

      {/* Sizes */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <SizeEditor value={sizes} onChange={setSizes} />
      </section>

      {/* Notification settings */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <NotificationSettings
          emailOutfitReady={emailOutfitReady}
          emailTrendAlert={emailTrendAlert}
          emailWeeklyDigest={emailWeeklyDigest}
          onToggle={handleNotificationToggle}
        />
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "SAVE CHANGES"}
        </Button>
      </div>
    </div>
  );
}
