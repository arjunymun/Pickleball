import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";

export default function NotFound() {
  return (
    <main className="page-frame min-h-screen px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col justify-between">
        <header className="flex items-center justify-between border-b border-[var(--line-soft)] pb-6">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="rounded-full bg-[var(--background-strong)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              404
            </span>
          </div>
        </header>

        <section className="surface-card-dark rounded-[2.4rem] p-8 sm:p-10">
          <p className="section-eyebrow !text-white/55">Route not found</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
            That surface is not live yet, but the club OS is.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
            Sideout currently ships with the marketing site, the customer preview, and the operator console. If you
            followed a stale route, head back into one of the live product surfaces.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/" className="primary-button">
              <ArrowLeft className="h-4 w-4" />
              Back to marketing
            </Link>
            <Link href="/app" className="secondary-button secondary-button-dark">
              Open customer preview
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
