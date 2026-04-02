"use client";

import { useState } from "react";
import { ArrowRight, Clock3, CreditCard, RotateCcw, ShieldCheck, Sparkles, Ticket } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import { courts, offers } from "@/lib/mock-data";
import { formatModeLabel, getAvailabilityClasses, getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const courtLookup = new Map(courts.map((court) => [court.id, court]));

const initialNotice: NoticeState = {
  tone: "info",
  message: "Shared demo state is live. Book on this screen, switch to /admin, and the operator console updates with the same booking state.",
};

export function CustomerDashboard() {
  const { customerExperience, bookSlot, cancelBooking, resetDemoState } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  async function runAction(action: () => Promise<string> | string) {
    try {
      const message = await action();
      setNotice({
        tone: "success",
        message,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not complete that action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow">Customer app</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
              A booking experience that already feels like membership.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
              Guests can browse availability first. Once they log in, Sideout turns into a repeat-play layer with live
              bookings, venue credits, packs, and offers that make return visits feel intentional.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Member</p>
                <p className="mt-3 text-xl font-semibold">{customerExperience.user.name}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{customerExperience.profile.skillBand}</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Wallet balance</p>
                <p className="mt-3 text-xl font-semibold">
                  {formatIndianCurrency(customerExperience.walletBalance)}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Credits first, payment rails second</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Favorite window</p>
                <p className="mt-3 text-xl font-semibold">{customerExperience.profile.favoriteWindow}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Offers stay targeted to real habits</p>
              </article>
            </div>
          </div>

          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow !text-white/55">Access model</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Browse first</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Guests can compare live availability, understand offers, and see the venue before creating an
                  account.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Mixed booking rules</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Some slots settle online, some use venue payment, and some unlock a credits-first booking path.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Value returns on cancellation</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Before the cutoff, Sideout restores venue value instead of pushing every change toward cash refunds.
                </p>
              </article>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.04}>
        <section className="mt-8">
          <div
            className={`surface-card flex flex-col gap-4 rounded-[1.7rem] border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${getNoticeClasses(
              notice.tone,
            )}`}
          >
            <div>
              <p className="section-eyebrow">Live demo state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-medium text-[var(--accent)]">
                Localhost synced
              </span>
              <button
                type="button"
                className="secondary-button px-4 py-2 text-sm"
                onClick={() => runAction(resetDemoState)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset demo
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal delay={0.06}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Availability feed"
              title="Book a court with enough context to trust the decision."
              description="Each slot makes the operational rule legible: court, duration, payment behavior, and whether the booking lands instantly or enters a review queue."
            />
            <div className="mt-8 grid gap-4">
              {customerExperience.slots.map((entry) => {
                const { blockingBooking, canBook, canUseWallet, cta, isOwnedByCustomer, slot } = entry;
                const effectiveAvailability = blockingBooking ? "booked" : slot.availabilityState;
                const court = courtLookup.get(slot.courtId);

                return (
                  <article
                    key={slot.id}
                    className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="section-eyebrow">{formatVenueDate(slot.startsAt)}</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{slot.label}</h2>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatVenueRange(slot.startsAt, slot.endsAt)} on {court?.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className={`rounded-full px-3 py-1 ${getAvailabilityClasses(effectiveAvailability)}`}>
                          {isOwnedByCustomer ? "Your booking" : effectiveAvailability}
                        </span>
                        <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-[var(--ink-soft)]">
                          {slot.confirmationMode === "instant" ? "Instant confirm" : "Review hold"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                        <Clock3 className="h-4 w-4" />
                        {slot.durationMinutes} min
                      </span>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                        {formatIndianCurrency(slot.priceInr)}
                      </span>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                        {formatModeLabel(slot.paymentMode)}
                      </span>
                      {canUseWallet ? (
                        <span className="rounded-full bg-[rgba(31,106,84,0.12)] px-3 py-2 text-[var(--accent-green)]">
                          Wallet ready
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                      {isOwnedByCustomer
                        ? "You already hold this court. Cancel before the cutoff to turn that value back into venue credit."
                        : canBook
                          ? slot.confirmationMode === "review"
                            ? "This hold enters the operator queue first. Staff confirms it from the admin side before it becomes final."
                            : slot.paymentMode === "pay_at_venue"
                              ? "This one settles at the venue after confirmation."
                              : canUseWallet
                                ? "The wallet covers this booking in full, so the reservation can confirm without another payment step."
                                : "This booking confirms now and records the settlement path that the operator will see on their side."
                          : "This court is already held in another booking flow."}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {isOwnedByCustomer && blockingBooking ? (
                        <button
                          type="button"
                          className="secondary-button px-4 py-2 text-sm"
                          onClick={() => runAction(() => cancelBooking(blockingBooking.id))}
                        >
                          Cancel booking
                        </button>
                      ) : canBook ? (
                        <button
                          type="button"
                          className="primary-button px-4 py-2 text-sm"
                          onClick={() => runAction(() => bookSlot(slot.id))}
                        >
                          {cta}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
                          Already held
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Wallet</p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                {formatIndianCurrency(customerExperience.walletBalance)}
              </p>
              <div className="mt-5 space-y-3">
                {customerExperience.walletEntries.map((entry) => (
                  <div key={entry.id} className="rounded-[1.2rem] bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{entry.note}</p>
                      <span className="text-sm font-semibold">
                        {entry.amountInr > 0 ? "+" : ""}
                        {formatIndianCurrency(entry.amountInr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Active products</p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-[1.3rem] bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-[var(--accent)]" />
                    <p className="font-medium">
                      {customerExperience.pack?.name ?? "Pack preview"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {customerExperience.packSnapshot?.creditsRemaining ?? 0} credits remaining
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[var(--accent-green)]" />
                    <p className="font-medium">
                      {customerExperience.membership?.name ?? "Membership preview"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {customerExperience.membershipSnapshot
                      ? `Renews on ${formatVenueDate(customerExperience.membershipSnapshot.renewsAt)}`
                      : "Ready for member-only pricing and monthly credits"}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </Reveal>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-dark rounded-[2rem] p-6">
            <p className="section-eyebrow !text-white/55">Upcoming bookings</p>
            <div className="mt-5 grid gap-4">
              {customerExperience.upcomingBookings.length > 0 ? (
                customerExperience.upcomingBookings.map(({ booking, slot }) => (
                  <article key={booking.id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{slot.label}</p>
                        <p className="mt-2 text-sm text-white/72">{formatVenueRange(slot.startsAt, slot.endsAt)}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                          {booking.paymentStatus.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/78">
                          {booking.status}
                        </span>
                        <button
                          type="button"
                          className="secondary-button secondary-button-dark px-4 py-2 text-sm"
                          onClick={() => runAction(() => cancelBooking(booking.id))}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-7 text-white/70">
                    No live bookings yet. Reserve a court above to see the operator dashboard update with the same
                    booking immediately.
                  </p>
                </article>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Offers"
              title="Promotions that feel targeted, not desperate."
              description="The customer sees reasons to come back. The operator sees which window, segment, and credit shape is actually moving behavior."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
                  <p className="section-eyebrow">{offer.status}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{offer.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{offer.headline}</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
