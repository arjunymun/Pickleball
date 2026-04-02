import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Compass, Shield } from "lucide-react";

import { AuthStatusPill } from "@/components/auth/auth-status-pill";
import { PreviewNav } from "@/components/ui/preview-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { getAuthState } from "@/lib/auth";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/communications", label: "Comms" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getAuthState();

  if (authState.isConfigured && authState.setupStatus !== "demo") {
    if (!authState.user) {
      redirect("/sign-in");
    }

    if (!authState.user.hasAdminAccess) {
      redirect("/app");
    }
  }

  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="surface-card-dark flex flex-col gap-5 rounded-[1.8rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Wordmark muted />
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/72">
              Operator preview
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-white/72">
            <Link href="/" className="inline-flex items-center gap-2 transition hover:text-white">
              <Compass className="h-4 w-4" />
              Marketing
            </Link>
            <Link href="/app" className="inline-flex items-center gap-2 transition hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
              Customer view
            </Link>
            <ThemeToggle inverted />
            <AuthStatusPill inverted />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-2 text-white">
              <Shield className="h-4 w-4" />
              Owner + staff roles
            </span>
          </nav>
        </header>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PreviewNav items={adminNavItems} inverted />
          <p className="max-w-2xl text-sm leading-7 text-white/65">
            The operator shell now covers setup, schedule control, customer memory, WhatsApp workflows, and commercial
            actions while staying role-gated in live mode for owner and staff accounts only.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
