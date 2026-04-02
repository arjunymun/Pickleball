"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface PreviewNavItem {
  href: string;
  label: string;
}

interface PreviewNavProps {
  items: PreviewNavItem[];
  inverted?: boolean;
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function PreviewNav({ items, inverted = false }: PreviewNavProps) {
  const pathname = usePathname();

  return (
    <nav className={`preview-nav ${inverted ? "preview-nav--inverted" : ""}`} aria-label="Section navigation">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`preview-nav__link ${isActive ? "is-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
