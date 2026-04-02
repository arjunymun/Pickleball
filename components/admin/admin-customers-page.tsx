"use client";

import { useState } from "react";
import { RotateCcw, Sparkles, UserRound } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueRange } from "@/lib/formatters";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message: "The customer route is now its own operator surface too: notes, inactivity, upcoming bookings, and manual credit nudges live here together.",
};

export function AdminCustomersPage() {
  const { addWalletCredit, adminDashboard, resetDemoState } = useSideoutDemo();
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
        message: error instanceof Error ? error.message : "Sideout could not complete that customer action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Customer intelligence</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Profiles that still matter after the booking is made.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              This route is where owners and staff can decide who needs a recovery touch, who already has momentum, and
              which customers deserve manual value before they lapse.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Customers</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.customers.length}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">At risk</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.atRiskCustomers.length}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Repeat play</p>
                <p className="metric-value mt-3 text-white">{Math.round(adminDashboard.metrics.repeatPlayRate)}%</p>
              </article>
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">At-risk right now</p>
            <div className="mt-5 grid gap-4">
              {adminDashboard.atRiskCustomers.map((entry) => (
                <article key={entry.profile.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--ink-strong)]">{entry.user.name}</p>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {entry.profile.favoriteWindow} / {entry.daysSinceLastAttendance} days inactive
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                      {entry.profile.tags[0]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{entry.note?.body}</p>
                </article>
              ))}
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
              <p className="section-eyebrow">Live customer state</p>
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
              eyebrow="Directory"
              title="A working customer roster with notes and actionability."
              description="This is intentionally more useful than a generic table. Every row should answer whether the customer is healthy, at risk, or ready for a commercial nudge."
            />
            <div className="mt-8 grid gap-4">
              {adminDashboard.customers.map((customer) => (
                <article key={customer.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--background-strong)] text-[var(--ink-soft)]">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold tracking-[-0.04em]">{customer.name}</h2>
                          <p className="mt-1 text-sm text-[var(--ink-soft)]">
                            {customer.favoriteWindow} / {customer.totalBookings} total bookings / {customer.membership}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {customer.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[rgba(31,106,84,0.12)] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent-green)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-7 text-[var(--ink-soft)]">
                        {customer.note?.body ?? "No operator note yet. This surface is ready for higher-touch customer memory."}
                      </p>
                      <div className="mt-5 grid gap-2 text-sm text-[var(--ink-soft)]">
                        <p>Credits available: {formatIndianCurrency(customer.creditsRemaining)}</p>
                        <p>Days since last attendance: {customer.daysSinceLastAttendance}</p>
                        <p>
                          Next booking:{" "}
                          {customer.nextBooking
                            ? `${customer.nextBooking.slot.label} / ${formatVenueRange(
                                customer.nextBooking.slot.startsAt,
                                customer.nextBooking.slot.endsAt,
                              )}`
                            : "No live booking"}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 lg:min-w-[220px]">
                      <button
                        type="button"
                        className="primary-button px-4 py-2 text-sm"
                        onClick={() =>
                          runAction(() =>
                            addWalletCredit(customer.id, 300, `Recovery credit added for ${customer.name}`),
                          )
                        }
                      >
                        Add INR 300
                      </button>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm text-[var(--ink-soft)]">
                        <Sparkles className="h-4 w-4" />
                        Manual retention nudge
                      </div>
                    </div>
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
