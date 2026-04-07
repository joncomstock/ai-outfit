"use client";

import { Input } from "@/components/ui/input";

const SIZE_CATEGORIES = [
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "shoes", label: "Shoes" },
  { key: "outerwear", label: "Outerwear" },
  { key: "dress", label: "Dresses" },
];

interface SizeEditorProps {
  value: Record<string, string>;
  onChange: (sizes: Record<string, string>) => void;
}

export function SizeEditor({ value, onChange }: SizeEditorProps) {
  const handleChange = (key: string, size: string) => {
    onChange({ ...value, [key]: size });
  };

  return (
    <div>
      <p className="label-text text-on-surface-variant tracking-widest mb-4">YOUR SIZES</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {SIZE_CATEGORIES.map((cat) => (
          <Input
            key={cat.key}
            label={cat.label}
            value={value[cat.key] ?? ""}
            onChange={(e) => handleChange(cat.key, e.target.value)}
            placeholder="e.g., M, 32, 10"
          />
        ))}
      </div>
    </div>
  );
}
