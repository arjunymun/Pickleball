"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useState } from "react";

type ThemeMode = "light" | "dark";

interface ThemeToggleProps {
  inverted?: boolean;
}

export function ThemeToggle({ inverted = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    window.localStorage.setItem("sideout-theme", nextTheme);
    setTheme(nextTheme);
  }

  const label = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
      className={`theme-toggle ${inverted ? "theme-toggle-inverted" : ""}`}
      suppressHydrationWarning
    >
      <span className={`theme-toggle__icon ${theme === "dark" ? "is-dark" : ""}`} suppressHydrationWarning>
        {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </span>
      <span className="theme-toggle__label" suppressHydrationWarning>
        {label}
      </span>
    </button>
  );
}
