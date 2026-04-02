import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/globals.css";

const themeScript = `
  (() => {
    try {
      const root = document.documentElement;
      const storedTheme = window.localStorage.getItem("sideout-theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : systemDark
            ? "dark"
            : "light";

      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Sideout | Dehradun Pickleball Club OS",
    template: "%s | Sideout",
  },
  description:
    "A premium repeat-play operating system for a real pickleball venue in Dehradun, with customer and operator experiences in one product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
