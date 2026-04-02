"use client";

import { useState } from "react";
import { CalendarRange, Coins, Clock3, RotateCcw } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatPercent, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import { formatModeLabel, getAvailabilityClasses, getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message: "This schedule route is the day-of-operations surface for Sideout. Queue actions, approvals, and inventory states all live here now.",
};

export function AdminSchedulePage() {
  const { adminDashboard, approveBooking, checkInBooking, completeBooking, markBookingNoShow, resetDemoState } =
    useSideoutDemo();
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
        message: error instanceof Error ? error.message : "Sideout could not complete that operator action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Schedule control</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Inventory, approvals, and court status on one dedicated board.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              This is the operator view that matters during the day. It turns Sideout into a venue control room instead
              of a static analytics page.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Occupancy</p>
                <p className="metric-value mt-3 text-white">{formatPercent(adminDashboard.metrics.occupancyRate)}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Review queue</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.requestQueue.length}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Confirmed next</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.upcomingConfirmed.length}</p>
              </article>
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">Live request queue</p>
            <div className="mt-5 grid gap-4">
              {adminDashboard.requestQueue.length > 0 ? (
                adminDashboard.requestQueue.map((entry) => (
                  <article key={entry.booking.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                          {entry.customer.name}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{entry.slot.label}</h2>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatVenueDate(entry.slot.startsAt)} / {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="primary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => approveBooking(entry.booking.id))}
                      >
                        Approve hold
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">
                    No review holds are waiting right now. Create one from the customer booking page to see this route update.
                  </p>
                </article>
              )}
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
              <p className="section-eyebrow">Live schedule state</p>
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

      <section className="mt-8">
        <Reveal delay={0.1}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Schedule board"
              title="Every seeded court slot in one working surface."
              description="Operators can scan availability, read booking state, and approve pending holds without jumping back to a single summary page."
            />
            <div className="mt-8 grid gap-4">
              {adminDashboard.schedule.map((entry) => (
                <article key={entry.slot.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="section-eyebrow">{formatVenueDate(entry.slot.startsAt)}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{entry.slot.label}</h2>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)} on {entry.court?.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className={`rounded-full px-3 py-1 ${getAvailabilityClasses(entry.effectiveAvailability)}`}>
                        {entry.effectiveAvailability}
                      </span>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-[var(--ink-soft)]">
                        {entry.slot.confirmationMode}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                      <Clock3 className="h-4 w-4" />
                      {entry.slot.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                      <Coins className="h-4 w-4" />
                      {formatIndianCurrency(entry.slot.priceInr)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                      <CalendarRange className="h-4 w-4" />
                      {formatModeLabel(entry.slot.paymentMode)}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-7 text-[var(--ink-soft)]">
                      {entry.blockingBooking
                        ? `${entry.customerName} currently owns this court in a ${entry.blockingBooking.status} state.`
                        : "Open inventory with no active hold yet."}
                    </p>
                    {entry.blockingBooking?.status === "requested" ? (
                      <button
                        type="button"
                        className="secondary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => approveBooking(entry.blockingBooking!.id))}
                      >
                        Approve
                      </button>
                    ) : entry.blockingBooking?.status === "confirmed" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="secondary-button px-4 py-2 text-sm"
                          onClick={() => runAction(() => checkInBooking(entry.blockingBooking!.id))}
                        >
                          Check in
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-4 py-2 text-sm"
                          onClick={() => runAction(() => markBookingNoShow(entry.blockingBooking!.id))}
                        >
                          No-show
                        </button>
                      </div>
                    ) : entry.blockingBooking?.status === "checked_in" ? (
                      <button
                        type="button"
                        className="secondary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => completeBooking(entry.blockingBooking!.id))}
                      >
                        Mark completed
                      </button>
                    ) : entry.blockingBooking ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
                        {entry.blockingBooking.status.replaceAll("_", " ")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[rgba(31,106,84,0.12)] px-4 py-2 text-sm font-medium text-[var(--accent-green)]">
                        Ready to sell
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
