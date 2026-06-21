import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

import { BookingStatus } from "./booking-status";

export const metadata = {
  title: "Booking Confirmation",
};

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; checkout?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="pt-8">
      <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
        <p className="section-eyebrow">Booking confirmation</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
          Payment received by Stripe. Sideout is syncing the booking state.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
          The checkout return page does not fake success. The booking becomes confirmed only after the verified Stripe
          webhook updates the server-side record. If the webhook is still processing, this page keeps checking until the
          booking is confirmed.
        </p>
        <div className="mt-8">
          <BookingStatus bookingId={params.booking ?? null} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent-green)]" />
            <p className="mt-4 font-medium">Checkout return</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{params.checkout ?? "success"}</p>
          </article>
          <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <p className="mt-4 font-medium">Booking reference</p>
            <p className="mt-2 break-all text-sm leading-7 text-[var(--ink-soft)]">{params.booking ?? "Pending sync"}</p>
          </article>
          <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
            <ShieldCheck className="h-5 w-5 text-[var(--accent-green)]" />
            <p className="mt-4 font-medium">Source of truth</p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">Verified webhook, not frontend optimism.</p>
          </article>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/app/bookings" className="primary-button">
            Back to bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/demo" className="secondary-button">
            View recruiter demo
          </Link>
        </div>
      </div>
    </section>
  );
}
