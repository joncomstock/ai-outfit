"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "H" },
  { href: "/closet", label: "Closet", icon: "C" },
  { href: "/outfits", label: "Outfits", icon: "O" },
  { href: "/trends", label: "Trends", icon: "T" },
  { href: "/catalog", label: "Shop", icon: "S" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-outline-variant/10 md:hidden">
      <div className="flex items-center justify-around py-3">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="text-lg font-sans font-semibold">
                {tab.icon}
              </span>
              <span className="text-[10px] font-sans uppercase tracking-widest">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
