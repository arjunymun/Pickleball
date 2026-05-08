"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck2, CreditCard, DatabaseZap, ShieldCheck, SplitSquareVertical, Users2 } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate, formatVenueRange } from "@/lib/formatters";

const storyBeats = [
  {
    icon: CalendarCheck2,
    title: "Customer selects a court",
    copy: "Availability is filtered by date, court, pricing, existing bookings, active holds, and operator blocks.",
  },
  {
    icon: ShieldCheck,
    title: "Sideout creates a temporary hold",
    copy: "The slot leaves inventory while the customer signs in or completes checkout, preventing double-booked courts.",
  },
  {
    icon: CreditCard,
    title: "Stripe confirms the booking",
    copy: "The frontend never marks paid bookings as successful. The webhook is the source of truth.",
  },
  {
    icon: Users2,
    title: "Operators manage the day",
    copy: "Staff can scan the schedule, approve review holds, block courts, adjust credits, and see payment state.",
  },
];

export function RecruiterDemoPage() {
  const { adminDashboard, catalog, customerExperience } = useSideoutDemo();
  const nextSlot = customerExperience.slots.find((entry) => entry.canBook) ?? customerExperience.slots[0];
  const nextBooking = customerExperience.upcomingBookings[0];

  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-[var(--line-soft)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[var(--ink-strong)]">
            <span className="inline-flex h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_40px_rgba(221,105,56,0.45)]" />
            <span className="font-medium">Sideout demo</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/demo/customer" className="secondary-button px-4 py-2 text-sm">
              Customer walkthrough
            </Link>
            <Link href="/demo/operator" className="secondary-button px-4 py-2 text-sm">
              Operator walkthrough
            </Link>
            <Link href="/app" className="primary-button px-4 py-2 text-sm">
              Live app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <Reveal>
            <p className="section-eyebrow">Recruiter walkthrough</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-7xl">
              A guided demo for explaining the real booking engine behind Sideout.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              This route is intentionally separate from the production app. Use it as a narrated tour: start with the
              customer booking, show the hold/payment lifecycle, then switch to the operator schedule and commercial
              controls.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/demo/customer" className="primary-button">
                Start customer flow
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/demo/operator" className="secondary-button">
                Open operator console
                <SplitSquareVertical className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="surface-card-dark rounded-[2rem] p-6">
              <p className="section-eyebrow !text-white/55">Two-minute script</p>
              <div className="mt-6 grid gap-4">
                {storyBeats.map((beat) => {
                  const Icon = beat.icon;
                  return (
                    <article key={beat.title} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-white/80" />
                        <p className="font-medium text-white">{beat.title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/70">{beat.copy}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <Reveal delay={0.1}>
            <article className="surface-card-strong rounded-[2rem] p-6">
              <p className="section-eyebrow">Next available slot</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{nextSlot?.slot.label ?? "No slot"}</h2>
              {nextSlot ? (
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                  {formatVenueDate(nextSlot.slot.startsAt)} / {formatVenueRange(nextSlot.slot.startsAt, nextSlot.slot.endsAt)} /{" "}
                  {formatIndianCurrency(nextSlot.slot.priceInr)}
                </p>
              ) : null}
            </article>
          </Reveal>
          <Reveal delay={0.14}>
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Payment state</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                {nextBooking?.booking.paymentStatus.replaceAll("_", " ") ?? "pending checkout"}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                The demo separates hold creation from paid confirmation so the webhook story is easy to explain.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.18}>
            <article className="surface-card-dark rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <DatabaseZap className="h-5 w-5 text-white/80" />
                <p className="section-eyebrow !text-white/55">Backend proof</p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
                {adminDashboard.schedule.length} court windows
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Schema covers holds, payments, blocked slots, price rules, packs, memberships, wallet credits, and logs.
              </p>
            </article>
          </Reveal>
        </section>

        <section className="mt-8">
          <Reveal delay={0.2}>
            <div className="surface-card-strong rounded-[2rem] p-6">
              <SectionHeading
                eyebrow="What to say"
                title="The demo is structured around the hard parts, not page decoration."
                description="Lead with conflict-safe reservations, webhook-confirmed payments, and role-gated operations. Then point at the polished UI as proof that the technical engine is usable by customers and staff."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {catalog.membershipPlans.map((plan) => (
                  <article key={plan.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
                    <p className="section-eyebrow">Membership</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{plan.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{plan.perks[0]}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  );
}
