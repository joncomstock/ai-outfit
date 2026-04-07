"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Analytics", icon: "A" },
  { href: "/admin/trends", label: "Trends", icon: "T" },
  { href: "/admin/catalog", label: "Catalog", icon: "C" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-inverse-surface min-h-screen p-6 flex flex-col">
      <Link
        href="/admin"
        className="font-serif text-title-lg text-inverse-on-surface mb-10 block"
      >
        Outfit Engine
      </Link>
      <span className="label-text text-inverse-on-surface/50 tracking-widest mb-4">
        ADMINISTRATION
      </span>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-body-md font-sans transition-colors duration-150 ${
                isActive
                  ? "bg-inverse-primary/20 text-inverse-primary"
                  : "text-inverse-on-surface/70 hover:text-inverse-on-surface hover:bg-inverse-on-surface/5"
              }`}
            >
              <span className="font-semibold text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-inverse-on-surface/10">
        <Link
          href="/"
          className="text-body-md text-inverse-on-surface/50 hover:text-inverse-on-surface font-sans"
        >
          Back to App
        </Link>
      </div>
    </aside>
  );
}
