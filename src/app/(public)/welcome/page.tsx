import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outfit Engine — Your Closet, Curated by AI",
  description:
    "Upload your wardrobe. Get styled by artificial intelligence. Shop the missing pieces.",
};

const steps = [
  {
    number: "01",
    heading: "Upload",
    description:
      "Photograph your wardrobe. Our AI vision system catalogs every piece — color, fit, season, style.",
  },
  {
    number: "02",
    heading: "Generate",
    description:
      "Artificial intelligence composes complete outfits from your closet, styled to your preferences.",
  },
  {
    number: "03",
    heading: "Shop",
    description:
      "Discover the missing pieces. Curated product recommendations that complete your looks.",
  },
];

const features = [
  {
    heading: "AI Vision Analysis",
    description:
      "Detects colors, fit, seasonality, and style attributes from a single photograph of each garment.",
  },
  {
    heading: "Smart Outfit Generation",
    description:
      "Composes complete, balanced looks from your existing wardrobe using style intelligence.",
  },
  {
    heading: "Trend Intelligence",
    description:
      "Real-time fashion momentum tracking surfaces styles gaining cultural relevance.",
  },
  {
    heading: "Fit Learning",
    description:
      "Personalized size and fit recommendations that improve with every piece you add.",
  },
];

export default function WelcomePage() {
  return (
    <div className="bg-surface text-on-surface min-h-dvh">
      {/* ── Hero ── */}
      <section className="min-h-dvh grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 md:px-16 lg:px-20 py-20">
          <span className="label-text text-on-surface-variant tracking-widest mb-6">
            OUTFIT ENGINE
          </span>
          <h1 className="font-serif text-display-sm md:text-display-md lg:text-display-lg text-on-surface leading-tight mb-8">
            Your closet,
            <br />
            <span className="italic text-primary">curated by AI.</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-md mb-12">
            Upload your wardrobe. Get styled by artificial intelligence. Shop
            the missing pieces.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center font-sans min-h-[44px] editorial-gradient text-on-primary label-text px-8 py-3 hover:opacity-90 transition-opacity duration-150"
            >
              GET STARTED
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center font-sans min-h-[44px] bg-transparent ghost-border text-on-surface label-text px-8 py-3 hover:bg-surface-container-low transition-colors duration-150"
            >
              SIGN IN
            </Link>
          </div>
        </div>
        <div className="hidden lg:block bg-surface-container-low relative overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-[0.07]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-on-surface" />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-surface-container-low px-6 md:px-16 lg:px-20 py-24">
        <span className="label-text text-on-surface-variant tracking-widest mb-12 block">
          HOW IT WORKS
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step) => (
            <div key={step.number}>
              <p className="font-serif text-display-sm text-primary mb-4">
                {step.number}
              </p>
              <h3 className="font-serif text-headline-md text-on-surface mb-3">
                {step.heading}
              </h3>
              <p className="text-body-lg text-on-surface-variant max-w-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 md:px-16 lg:px-20 py-24">
        <span className="label-text text-on-surface-variant tracking-widest mb-4 block">
          CAPABILITIES
        </span>
        <h2 className="font-serif text-display-sm md:text-display-md text-on-surface leading-tight mb-16">
          Intelligence meets style.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.heading}
              className="bg-surface-container-low p-8 md:p-10"
            >
              <h3 className="font-serif text-headline-sm text-on-surface mb-3">
                {feature.heading}
              </h3>
              <p className="text-body-lg text-on-surface-variant">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-surface-container-low px-6 md:px-16 lg:px-20 py-24 text-center">
        <h2 className="font-serif text-display-sm md:text-display-md text-on-surface leading-tight mb-10 italic">
          Ready to transform your closet?
        </h2>
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center font-sans min-h-[44px] editorial-gradient text-on-primary label-text px-10 py-4 hover:opacity-90 transition-opacity duration-150"
        >
          START YOUR STYLE JOURNEY
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-16 lg:px-20 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-serif text-body-lg text-on-surface">
          Outfit Engine
        </span>
        <span className="text-body-md text-on-surface-variant">
          &copy; {new Date().getFullYear()} Outfit Engine. All rights reserved.
        </span>
        <div className="flex gap-6">
          <Link
            href="/sign-in"
            className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </footer>
    </div>
  );
}
