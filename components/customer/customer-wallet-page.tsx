"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Coins, CreditCard, RotateCcw, Sparkles, Ticket } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message: "This wallet surface is built around stored value, not just payment receipts. That is the real business model behind repeat play.",
};

export function CustomerWalletPage() {
  const { bookSlot, customerExperience, resetDemoState } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const recommendedSlot = useMemo(
    () =>
      customerExperience.slots.find((entry) => entry.canBook && entry.canUseWallet) ??
      customerExperience.slots.find((entry) => entry.canBook) ??
      null,
    [customerExperience.slots],
  );

  function runAction(action: () => string) {
    try {
      setNotice({
        tone: "success",
        message: action(),
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not complete that wallet action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow">Wallet and value</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
              Credits, packs, and membership value in one customer surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
              Sideout treats venue value like a deliberate product layer. The customer sees what is usable right now,
              what renews next, and what should be spent before it goes stale.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Wallet balance</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {formatIndianCurrency(customerExperience.walletBalance)}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Live venue credit</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Pack credits</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.packSnapshot?.creditsRemaining ?? 0}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{customerExperience.pack?.name ?? "No pack"}</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Membership</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.membership ? "Active" : "Preview"}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {customerExperience.membership?.name ?? "Membership value layer"}
                </p>
              </article>
            </div>
          </div>

          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow !text-white/55">Value model</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Wallet value is spendable across eligible slots</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Credits are not decorative. They change booking behavior and give the operator a real retention lever.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Packs handle expiring value without ugly billing logic</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  This is the soft commercial engine behind repeat play, especially when you do not want to blanket-discount the whole venue.
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
              <p className="section-eyebrow">Live value state</p>
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

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <Reveal delay={0.08}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <SectionHeading
                eyebrow="Wallet ledger"
                title="Where your stored value came from."
                description="This ledger is meant to feel clear and premium, not like raw accounting output."
              />
              <div className="mt-8 space-y-3">
                {customerExperience.walletEntries.map((entry) => (
                  <div key={entry.id} className="rounded-[1.2rem] bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{entry.note}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                          {formatVenueDate(entry.createdAt)}
                        </p>
                      </div>
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
                    <p className="font-medium">{customerExperience.pack?.name ?? "Weekday pack preview"}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {customerExperience.packSnapshot?.creditsRemaining ?? 0} credits remaining
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[var(--accent-green)]" />
                    <p className="font-medium">{customerExperience.membership?.name ?? "Club membership preview"}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {customerExperience.membershipSnapshot
                      ? `Renews on ${formatVenueDate(customerExperience.membershipSnapshot.renewsAt)}`
                      : "Use this area for monthly credit drops and member-only perks"}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Best next use"
              title="Spend value where it creates the cleanest booking moment."
              description="This page makes it obvious when the wallet can cover the next reservation and when the customer still needs another payment rail."
            />
            {recommendedSlot ? (
              <div className="mt-8 rounded-[1.7rem] border border-[var(--line-soft)] bg-white/75 p-6">
                <p className="section-eyebrow">Recommended slot</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{recommendedSlot.slot.label}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {formatVenueDate(recommendedSlot.slot.startsAt)} / {formatVenueRange(
                    recommendedSlot.slot.startsAt,
                    recommendedSlot.slot.endsAt,
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--ink-soft)]">
                  <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                    {formatIndianCurrency(recommendedSlot.slot.priceInr)}
                  </span>
                  <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                    {recommendedSlot.canUseWallet ? "Wallet-covered" : "Payment still required"}
                  </span>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
                  {recommendedSlot.canUseWallet
                    ? "Your current credit balance can cover this booking in full, so Sideout can convert value into another visit immediately."
                    : "This is still a good next slot, but the wallet is no longer enough to fully cover it."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="primary-button px-4 py-2 text-sm"
                    onClick={() => runAction(() => bookSlot(recommendedSlot.slot.id))}
                  >
                    Book this slot
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm text-[var(--ink-soft)]">
                    <CreditCard className="h-4 w-4" />
                    {recommendedSlot.canUseWallet ? "Credits-first flow" : "Online or venue payment"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[1.7rem] border border-[var(--line-soft)] bg-white/75 p-6">
                <p className="text-sm leading-7 text-[var(--ink-soft)]">
                  All seeded slots are currently held. Reset the demo or free one from the bookings route to re-open a
                  spend opportunity.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
