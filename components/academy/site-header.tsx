"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AcademyBrand } from "@/components/academy/brand";
import styles from "./site-header.module.css";

const links = [
  { href: "/#courts", label: "The courts" },
  { href: "/membership", label: "Membership" },
  { href: "/#visit", label: "Visit us" },
  { href: "/app", label: "My bookings" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`academy-header ${styles.header}`}>
      <div
        className={`academy-container academy-header__inner ${styles.inner}`}
      >
        <AcademyBrand />
        <nav
          className={`academy-header__nav ${styles.desktopNav}`}
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={`academy-header__actions ${styles.desktopActions}`}>
          <Link href="/sign-in" className="academy-button-secondary">
            Sign in
          </Link>
          <Link href="/book" className={`academy-button ${styles.bookButton}`}>
            Book a court
          </Link>
        </div>
        <div className={styles.mobileActions}>
          <Link href="/book" className={`academy-button ${styles.bookButton}`}>
            Book a court
          </Link>
          <button
            ref={menuButtonRef}
            className={styles.menuButton}
            type="button"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      <nav
        id={menuId}
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
        aria-label="Main navigation"
        hidden={!menuOpen}
      >
        <div className={`academy-container ${styles.mobileNavInner}`}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link href="/sign-in" onClick={closeMenu}>
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
