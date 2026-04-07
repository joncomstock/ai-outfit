"use client";

interface NotificationSettingsProps {
  emailOutfitReady: boolean;
  emailTrendAlert: boolean;
  emailWeeklyDigest: boolean;
  onToggle: (key: string, value: boolean) => void;
}

const SETTINGS = [
  { key: "emailOutfitReady", label: "Outfit Ready", description: "Get notified when your AI outfit is complete" },
  { key: "emailTrendAlert", label: "Trend Alerts", description: "New trends matching your style preferences" },
  { key: "emailWeeklyDigest", label: "Weekly Digest", description: "A weekly summary of your style insights" },
];

export function NotificationSettings({
  emailOutfitReady,
  emailTrendAlert,
  emailWeeklyDigest,
  onToggle,
}: NotificationSettingsProps) {
  const values: Record<string, boolean> = { emailOutfitReady, emailTrendAlert, emailWeeklyDigest };

  return (
    <div>
      <p className="label-text text-on-surface-variant tracking-widest mb-4">EMAIL NOTIFICATIONS</p>
      <div className="flex flex-col gap-4">
        {SETTINGS.map((setting) => (
          <label
            key={setting.key}
            className="flex items-center justify-between py-3 border-b border-outline-variant/10 cursor-pointer"
          >
            <div>
              <p className="text-body-lg text-on-surface font-sans">{setting.label}</p>
              <p className="text-body-md text-on-surface-variant">{setting.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values[setting.key]}
              onClick={() => onToggle(setting.key, !values[setting.key])}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                values[setting.key] ? "bg-primary" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface transition-transform duration-200 ${
                  values[setting.key] ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
