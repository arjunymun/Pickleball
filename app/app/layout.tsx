import Link from "next/link";
import { ArrowUpRight, Compass, UserRound } from "lucide-react";

import { PreviewNav } from "@/components/ui/preview-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";

const customerNavItems = [
  { href: "/app", label: "Overview" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/wallet", label: "Wallet" },
  { href: "/app/offers", label: "Offers" },
];

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="surface-card-strong flex flex-col gap-5 rounded-[1.8rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Wordmark />
            <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              Customer preview
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
            <Link href="/" className="inline-flex items-center gap-2 transition hover:text-[var(--ink-strong)]">
              <Compass className="h-4 w-4" />
              Marketing
            </Link>
            <Link href="/admin" className="inline-flex items-center gap-2 transition hover:text-[var(--ink-strong)]">
              <ArrowUpRight className="h-4 w-4" />
              Admin view
            </Link>
            <ThemeToggle />
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[var(--accent)]">
              <UserRound className="h-4 w-4" />
              Guest browse enabled
            </span>
          </nav>
        </header>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PreviewNav items={customerNavItems} />
          <p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
            Version 1.2 expands the customer preview into a fuller product surface with dedicated bookings, wallet, and
            offer routes, all backed by the same live demo state.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
