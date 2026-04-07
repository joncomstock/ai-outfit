"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StylePreferencesEditor } from "@/components/profile/style-preferences-editor";
import { SizeEditor } from "@/components/profile/size-editor";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { useToast } from "@/components/ui/toast";

interface ColorStats {
  colorFrequency: Record<string, number>;
}

const COLOR_NAMES: Record<string, string> = {
  "#000000": "Ink",
  "#ffffff": "Snow",
  "#1b1c1a": "Onyx",
  "#f5f5dc": "Cream",
  "#808080": "Slate",
  "#a0522d": "Sienna",
  "#8b4513": "Saddle",
  "#d2691e": "Amber",
  "#c0392b": "Garnet",
  "#2c3e50": "Navy",
  "#27ae60": "Moss",
  "#f39c12": "Marigold",
};

function getColorName(hex: string): string {
  return COLOR_NAMES[hex.toLowerCase()] ?? hex.replace("#", "").slice(0, 4).toUpperCase();
}

interface ProfileUser {
  id: string;
  email: string;
  displayName: string;
  stylePreferences: string[];
  sizes: Record<string, string>;
  budgetRange: string;
  createdAt: string;
}

interface ProfileClientProps {
  user: ProfileUser;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [stylePreferences, setStylePreferences] = useState<string[]>(user.stylePreferences);
  const [sizes, setSizes] = useState<Record<string, string>>(user.sizes);
  const [budgetRange, setBudgetRange] = useState(user.budgetRange);
  const [saving, setSaving] = useState(false);
  const [colorStats, setColorStats] = useState<ColorStats | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState("");

  const memberSince = new Date(user.createdAt).getFullYear();

  // Fetch color frequency from closet stats
  useEffect(() => {
    fetch("/api/closet/stats")
      .then((res) => res.json())
      .then((data) => setColorStats({ colorFrequency: data.colorFrequency ?? {} }))
      .catch(() => {});
  }, []);

  const topColors = colorStats
    ? Object.entries(colorStats.colorFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  const totalColorCount = topColors.reduce((sum, [, count]) => sum + count, 0);

  const addBrand = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands([...brands, trimmed]);
      setBrandInput("");
    }
  };

  const removeBrand = (brand: string) => {
    setBrands(brands.filter((b) => b !== brand));
  };

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
      {/* ── Profile Header ── */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low relative overflow-hidden">
            {clerkUser?.imageUrl ? (
              <Image src={clerkUser.imageUrl} alt={displayName || "Profile"} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="font-serif text-display-sm text-on-surface-variant">
                  {(displayName || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="font-serif text-display-sm text-on-surface">{displayName || "Your Profile"}</h1>
            <span className="label-text text-on-surface-variant tracking-widest">
              EST. {memberSince}
            </span>
          </div>
        </div>
      </section>

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

      {/* Your Palette */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <p className="label-text text-on-surface-variant tracking-widest mb-6">YOUR PALETTE</p>
        {topColors.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {topColors.map(([color, count]) => {
              const pct = totalColorCount > 0 ? Math.round((count / totalColorCount) * 100) : 0;
              return (
                <div key={color} className="flex flex-col items-center gap-2">
                  <span className="w-12 h-12 block" style={{ backgroundColor: color }} />
                  <span className="font-serif text-body-md text-on-surface">{pct}%</span>
                  <span className="label-text text-on-surface-variant text-[10px] tracking-widest uppercase">
                    {getColorName(color)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-body-lg text-on-surface-variant">
            Upload items to your closet to see your color palette.
          </p>
        )}
      </section>

      {/* Favorite Brands */}
      <section className="mb-12 pb-12 border-b border-outline-variant/10">
        <p className="label-text text-on-surface-variant tracking-widest mb-6">FAVORITE BRANDS</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {brands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => removeBrand(brand)}
              className="ghost-border px-4 py-2 text-body-md text-on-surface hover:text-primary transition-colors duration-150 flex items-center gap-2"
            >
              {brand}
              <span className="text-on-surface-variant text-xs">&times;</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3 max-w-md">
          <Input
            label="Add a brand"
            value={brandInput}
            onChange={(e) => setBrandInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBrand(); } }}
          />
          <Button variant="tertiary" onClick={addBrand}>ADD</Button>
        </div>
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
