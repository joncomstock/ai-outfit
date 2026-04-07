"use client";

import { Input } from "@/components/ui/input";

interface Measurements {
  heightCm: number | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  shouldersCm: number | null;
  inseamCm: number | null;
}

interface MeasurementsFormProps {
  value: Measurements;
  onChange: (measurements: Measurements) => void;
}

const FIELDS: { key: keyof Measurements; label: string; unit: string }[] = [
  { key: "heightCm", label: "Height", unit: "cm" },
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "chestCm", label: "Chest", unit: "cm" },
  { key: "waistCm", label: "Waist", unit: "cm" },
  { key: "hipsCm", label: "Hips", unit: "cm" },
  { key: "shouldersCm", label: "Shoulders", unit: "cm" },
  { key: "inseamCm", label: "Inseam", unit: "cm" },
];

export function MeasurementsForm({ value, onChange }: MeasurementsFormProps) {
  const handleChange = (key: keyof Measurements, raw: string) => {
    const num = raw === "" ? null : parseInt(raw, 10);
    if (raw !== "" && isNaN(num as number)) return;
    onChange({ ...value, [key]: num });
  };

  return (
    <div>
      <p className="label-text text-on-surface-variant tracking-widest mb-4">BODY MEASUREMENTS</p>
      <p className="text-body-md text-on-surface-variant mb-6">
        These measurements help our AI recommend better-fitting pieces. All fields are optional.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            label={`${field.label} (${field.unit})`}
            type="number"
            value={value[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.unit}
          />
        ))}
      </div>
    </div>
  );
}
