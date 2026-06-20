import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Compass, UserRound } from "lucide-react";

import { AuthStatusPill } from "@/components/auth/auth-status-pill";
import { PwaInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { PreviewNav } from "@/components/ui/preview-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { getAuthState } from "@/lib/auth";

const customerNavItems = [
  { href: "/app", label: "Overview" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/wallet", label: "Wallet" },
  { href: "/app/offers", label: "Offers" },
];

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getAuthState();

  // When Supabase is configured but the visitor is signed out, send them to sign-in
  // instead of rendering an empty dashboard. The no-Supabase demo runtime
  // (isConfigured=false, setupStatus="demo") falls through untouched so /app still
  // renders the functional demo on the public deploy.
  if (authState.isConfigured && authState.setupStatus !== "demo" && !authState.user) {
    redirect("/sign-in?next=/app");
  }

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
            <Link href="/demo" className="inline-flex items-center gap-2 transition hover:text-[var(--ink-strong)]">
              Demo
            </Link>
            <PwaInstallPrompt />
            <ThemeToggle />
            <AuthStatusPill />
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[var(--accent)]">
              <UserRound className="h-4 w-4" />
              Live mode
            </span>
          </nav>
        </header>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PreviewNav items={customerNavItems} />
          <p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
            The customer shell is now live-first: sign in, create holds, confirm with Stripe-backed payment state, and
            manage real reservations. Demo walkthroughs live separately at `/demo`.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
