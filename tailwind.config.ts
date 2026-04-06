import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fbf9f6",
          dim: "#dbdad7",
          bright: "#fbf9f6",
          container: {
            DEFAULT: "#efeeeb",
            low: "#f5f3f0",
            high: "#eae8e5",
            highest: "#e4e2df",
            lowest: "#ffffff",
          },
        },
        primary: {
          DEFAULT: "#974232",
          container: "#b65948",
          fixed: "#ffdad3",
          "fixed-dim": "#ffb4a6",
        },
        "on-surface": {
          DEFAULT: "#1b1c1a",
          variant: "#55423f",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#fffbff",
        },
        secondary: {
          DEFAULT: "#80534a",
          container: "#fdc1b5",
        },
        tertiary: {
          DEFAULT: "#006955",
          container: "#00846c",
        },
        outline: {
          DEFAULT: "#88726e",
          variant: "#dbc1bc",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        inverse: {
          surface: "#30312f",
          "on-surface": "#f2f0ed",
          primary: "#ffb4a6",
        },
      },
      fontFamily: {
        serif: ["var(--font-noto-serif)", "serif"],
        sans: ["var(--font-manrope)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-md": ["2.75rem", { lineHeight: "1.15", fontWeight: "700" }],
        "display-sm": ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg": ["2rem", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-md": ["1.75rem", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.35", fontWeight: "600" }],
        "title-lg": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-lg": ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "label-lg": [
          "0.875rem",
          { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.1em" },
        ],
        "label-md": [
          "0.75rem",
          { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.1em" },
        ],
      },
      borderRadius: {
        none: "0px",
      },
      boxShadow: {
        ambient: "0 0 40px 0 rgba(151, 66, 50, 0.06)",
        "ambient-lg": "0 0 60px 0 rgba(151, 66, 50, 0.1)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
