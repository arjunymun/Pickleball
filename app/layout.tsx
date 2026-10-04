import type { Metadata } from "next";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ACADEMY } from "@/lib/academy/config";
import "@/app/globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display", display: "swap" });
const description = "Book one of four outdoor pickleball courts at Doon Pickleball Academy, GMS Road, Dehradun. Open 6 AM–midnight. Court bookings from ₹500/hour, ₹400 for members.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: `${ACADEMY.name} | Play in Dehradun`, template: `%s | ${ACADEMY.name}` },
  description,
  openGraph: { type: "website", locale: "en_IN", siteName: ACADEMY.name, title: ACADEMY.name, description },
  twitter: { card: "summary_large_image", title: ACADEMY.name, description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <a className="academy-skip-link" href="#main-content">Skip to content</a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
