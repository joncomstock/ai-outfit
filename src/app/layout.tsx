import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Outfit Engine", template: "%s | Outfit Engine" },
  description:
    "Your AI stylist — turn your closet into a personal styling engine",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://outfitengine.com",
  ),
  openGraph: {
    type: "website",
    siteName: "Outfit Engine",
    title: "Outfit Engine — Your AI Stylist",
    description:
      "Upload your wardrobe. Get styled by AI. Shop the missing pieces.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
