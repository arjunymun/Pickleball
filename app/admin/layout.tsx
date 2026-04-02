import Link from "next/link";
import { ArrowUpRight, Compass, Shield } from "lucide-react";

import { Wordmark } from "@/components/ui/wordmark";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-2 text-white">
              <Shield className="h-4 w-4" />
              Owner + staff roles
            </span>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
