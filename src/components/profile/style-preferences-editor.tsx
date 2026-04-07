"use client";

import { useState } from "react";

const STYLE_OPTIONS = [
  "minimalist",
  "streetwear",
  "classic",
  "bohemian",
  "sporty",
  "avant-garde",
  "preppy",
  "romantic",
  "grunge",
  "athleisure",
  "coastal",
  "dark academia",
];

interface StylePreferencesEditorProps {
  value: string[];
  onChange: (styles: string[]) => void;
}

export function StylePreferencesEditor({ value, onChange }: StylePreferencesEditorProps) {
  const toggle = (style: string) => {
    if (value.includes(style)) {
      onChange(value.filter((s) => s !== style));
    } else {
      onChange([...value, style]);
    }
  };

  return (
    <div>
      <p className="label-text text-on-surface-variant tracking-widest mb-4">STYLE IDENTITY</p>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Style preferences">
        {STYLE_OPTIONS.map((style) => {
          const isSelected = value.includes(style);
          return (
            <button
              key={style}
              type="button"
              onClick={() => toggle(style)}
              className={`px-4 py-2 text-body-md font-sans transition-colors duration-150 ${
                isSelected
                  ? "editorial-gradient text-on-primary"
                  : "ghost-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              }`}
              aria-pressed={isSelected}
            >
              {style}
            </button>
          );
        })}
      </div>
    </div>
  );
}
