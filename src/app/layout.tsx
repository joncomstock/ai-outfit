import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outfit Engine",
  description: "Your AI stylist — turn your closet into a personal styling engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
