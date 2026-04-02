"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck2, RotateCcw, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import { courts } from "@/lib/mock-data";
import { formatModeLabel, getAvailabilityClasses, getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const courtLookup = new Map(courts.map((court) => [court.id, court]));

const initialNotice: NoticeState = {
  tone: "info",
  message: "Version 1.2 turns bookings into their own product surface. All actions still sync back to the overview and operator routes.",
};

export function CustomerBookingsPage() {
  const { bookSlot, cancelBooking, customerExperience, resetDemoState } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const openSlots = useMemo(
    () => customerExperience.slots.filter((entry) => entry.canBook),
    [customerExperience.slots],
  );

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
        message: error instanceof Error ? error.message : "Sideout could not complete that booking action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow">Bookings</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
              Live court holds, not a fake calendar shell.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
              This route is focused entirely on the booking flow: current holds, instant confirmations, and review-based
              requests that surface immediately in the operator queue.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Upcoming</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.upcomingBookings.length}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Live bookings in your account</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Open slots</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{openSlots.length}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Inventory still bookable right now</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Wallet-ready</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {openSlots.filter((entry) => entry.canUseWallet).length}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Slots you can confirm with credits</p>
              </article>
            </div>
          </div>

          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow !text-white/55">Policy frame</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Review-based requests stay visible</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Request a coach hold here, then approve it from `/admin/schedule` without losing the product context.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Cancellation keeps value inside the venue</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Live cancellations restore venue credit where applicable, which is a better business behavior than a
                  blanket refund pattern.
                </p>
              </article>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="mt-8">
          <div
            className={`surface-card flex flex-col gap-4 rounded-[1.7rem] border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${getNoticeClasses(
              notice.tone,
            )}`}
          >
            <div>
              <p className="section-eyebrow">Live booking state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <button
              type="button"
              className="secondary-button px-4 py-2 text-sm"
              onClick={() => runAction(resetDemoState)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-dark rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Upcoming"
              title="Everything already on your calendar."
              description="These are the live bookings tied to your account. Cancel here and the operator side sees it immediately."
            />
            <div className="mt-8 grid gap-4">
              {customerExperience.upcomingBookings.length > 0 ? (
                customerExperience.upcomingBookings.map(({ booking, slot }) => (
                  <article key={booking.id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{slot.label}</p>
                        <p className="mt-2 text-sm text-white/72">{formatVenueDate(slot.startsAt)}</p>
                        <p className="mt-2 text-sm text-white/72">{formatVenueRange(slot.startsAt, slot.endsAt)}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                          {formatModeLabel(booking.paymentStatus)}
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
                    No upcoming bookings yet. Reserve one from the right-hand column and it will appear here instantly.
                  </p>
                </article>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Open inventory"
              title="Choose the next court from a cleaner booking board."
              description="This view narrows the customer app down to what matters most right before conversion."
            />
            <div className="mt-8 grid gap-4">
              {openSlots.map((entry) => {
                const court = courtLookup.get(entry.slot.courtId);

                return (
                  <article key={entry.slot.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="section-eyebrow">{formatVenueDate(entry.slot.startsAt)}</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{entry.slot.label}</h2>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)} on {court?.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className={`rounded-full px-3 py-1 ${getAvailabilityClasses(entry.slot.availabilityState)}`}>
                          {entry.slot.availabilityState}
                        </span>
                        <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-[var(--ink-soft)]">
                          {entry.slot.confirmationMode === "review" ? "Review hold" : "Instant confirm"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                        {formatIndianCurrency(entry.slot.priceInr)}
                      </span>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                        {formatModeLabel(entry.slot.paymentMode)}
                      </span>
                      {entry.canUseWallet ? (
                        <span className="rounded-full bg-[rgba(31,106,84,0.12)] px-3 py-2 text-[var(--accent-green)]">
                          Book with credits
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-sm leading-7 text-[var(--ink-soft)]">
                        {entry.slot.confirmationMode === "review"
                          ? "This request lands in the operator queue for manual confirmation."
                          : "This slot confirms immediately and preserves its settlement mode for the venue."}
                      </p>
                      <button
                        type="button"
                        className="primary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => bookSlot(entry.slot.id))}
                      >
                        {entry.cta}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
