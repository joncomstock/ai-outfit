"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/closet", label: "Closet" },
  { href: "/outfits", label: "Outfits" },
  { href: "/trends", label: "Trends" },
  { href: "/catalog", label: "Catalog" },
  { href: "/capsules", label: "Capsules" },
  { href: "/feed", label: "Feed" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 glass border-b border-outline-variant/10">
      <nav className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-title-lg text-on-surface">
          Outfit Engine
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-body-md font-sans transition-colors duration-150 ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link
            href="/profile"
            className="text-body-md text-on-surface-variant hover:text-on-surface transition-colors font-sans hidden md:block"
          >
            Profile
          </Link>
          <UserButton />
        </div>
      </nav>
    </header>
  );
}
