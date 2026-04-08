import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Outfit Engine",
  description: "How Outfit Engine collects, uses, and protects your data.",
};

const LAST_UPDATED = "April 7, 2026";

const sections = [
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    content: [
      "When you create an account, we collect your email address and basic profile information through our authentication provider (Clerk).",
      "When you upload clothing photos, those images are stored securely and analyzed by Claude, Anthropic's AI, to extract style attributes such as color, fit, category, and seasonality. The raw image files are stored in Vercel Blob storage.",
      "We collect usage data such as which outfits you generate, products you view, and affiliate links you click. This data is stored in our database and used to improve your recommendations.",
      "We do not collect payment information. Outfit Engine is currently free to use during its alpha period.",
    ],
  },
  {
    id: "how-we-use-your-information",
    heading: "How We Use Your Information",
    content: [
      "Your clothing images and wardrobe data are used exclusively to generate outfit recommendations and provide the core styling service. We do not sell your personal data to third parties.",
      "Aggregate, anonymized usage patterns may be used to improve the AI models and recommendation quality over time.",
      "We may use your email address to send transactional notifications (such as when outfit generation completes) and occasional product updates. You can opt out of non-transactional emails at any time.",
      "Affiliate link click data is used to attribute revenue from product referrals. Individual click records are stored internally and not shared with retailers beyond what is necessary to process the referral.",
    ],
  },
  {
    id: "data-storage-and-security",
    heading: "Data Storage and Security",
    content: [
      "Your data is stored in a managed Postgres database (Neon) and object storage (Vercel Blob), both hosted on infrastructure with encryption at rest and in transit.",
      "Access to your account and wardrobe data is protected by Clerk's authentication system, which supports secure password handling and session management.",
      "Outfit Engine is in early alpha. While we take reasonable precautions to secure your data, no system is perfectly secure. We recommend not uploading images you would not want to be stored digitally.",
      "You can request deletion of your account and all associated data at any time by contacting us (see below) or through account settings. Deletion requests are processed within 30 days.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    content: [
      "If you have questions about this privacy policy, want to request access to your data, or want to delete your account, please contact us.",
      "This is an independent alpha project. We will respond to privacy inquiries as quickly as possible, typically within a few business days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-surface text-on-surface min-h-dvh">
      {/* Header */}
      <header className="bg-surface-container-low px-6 md:px-16 lg:px-20 py-16">
        <div className="max-w-[800px] mx-auto">
          <span className="label-text text-on-surface-variant tracking-widest block mb-6">
            LEGAL
          </span>
          <h1 className="font-serif text-display-sm text-on-surface mb-4">
            Privacy Policy
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Last updated {LAST_UPDATED}
          </p>
        </div>
      </header>

      {/* Intro */}
      <section className="px-6 md:px-16 lg:px-20 py-12">
        <div className="max-w-[800px] mx-auto">
          <p className="text-body-lg text-on-surface-variant">
            Outfit Engine is an AI-powered personal styling tool in early alpha.
            This policy explains what data we collect when you use the service,
            how we use it, and what controls you have over it. We have tried to
            keep this plain and honest rather than comprehensive but unreadable.
          </p>
        </div>
      </section>

      {/* Sections */}
      <div className="px-6 md:px-16 lg:px-20 pb-24">
        <div className="max-w-[800px] mx-auto space-y-0">
          {sections.map((section, i) => (
            <section
              key={section.id}
              className={i % 2 === 0 ? "py-12" : "bg-surface-container-low px-8 py-12 -mx-8"}
            >
              <span className="label-text text-on-surface-variant tracking-widest block mb-4">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-serif text-headline-sm text-on-surface mb-6">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-body-lg text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-low px-6 md:px-16 lg:px-20 py-10">
        <div className="max-w-[800px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <span className="label-text text-on-surface-variant tracking-widest">
            &copy; {new Date().getFullYear()} OUTFIT ENGINE
          </span>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="label-text text-on-surface-variant tracking-widest hover:text-on-surface transition-colors"
            >
              TERMS OF SERVICE
            </Link>
            <Link
              href="/"
              className="label-text text-on-surface-variant tracking-widest hover:text-on-surface transition-colors"
            >
              BACK TO APP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
