"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Gift, RotateCcw, Sparkles, Ticket } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate } from "@/lib/formatters";
import { membershipPlans, offers, packProducts } from "@/lib/mock-data";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message: "This route packages the commercial layer of Sideout: offers, memberships, and packs that drive repeat play without making the venue feel discount-first.",
};

export function CustomerOffersPage() {
  const { bookSlot, customerExperience, resetDemoState } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const activeOffers = useMemo(() => offers.filter((offer) => offer.status === "active"), []);

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
        message: error instanceof Error ? error.message : "Sideout could not complete that offer action.",
      });
    }
  }

  async function bookFromOffer(offerId: string) {
    const matchedSlot =
      customerExperience.slots.find(
        (entry) =>
          entry.canBook &&
          ((offerId === "offer-sunrise" && entry.slot.label.toLowerCase().includes("sunrise")) ||
            (offerId === "offer-member" && entry.slot.label.toLowerCase().includes("prime"))),
      ) ?? customerExperience.slots.find((entry) => entry.canBook);

    if (!matchedSlot) {
      throw new Error("No eligible slot is open for that offer right now.");
    }

    return await bookSlot(matchedSlot.slot.id);
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow">Offers and plans</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
              The commercial layer that makes repeat visits feel intentional.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
              This is where Sideout stops feeling like a booking site and starts feeling like a productized club:
              targeted recovery offers, member-aware plans, and packs that create better behavior without cheapening the
              venue.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Active offers</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{activeOffers.length}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Currently usable promotions</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Membership</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.membership ? "Active" : "Preview"}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{customerExperience.membership?.name ?? "Club Pass"}</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Pack value</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.packSnapshot?.creditsRemaining ?? 0}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Credits remaining in the active pack</p>
              </article>
            </div>
          </div>

          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow !text-white/55">Positioning</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Offers should feel earned, not desperate</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Recovery credit, sunrise nudges, and member-only perks all keep the product premium while still giving the operator commercial leverage.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Membership is more than a badge</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  It changes booking priority, value drops, and the feeling of belonging to the venue.
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
              <p className="section-eyebrow">Live offer state</p>
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

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Active offers"
              title="Promotions designed around return behavior."
              description="Each offer tries to move a specific part of the venue calendar, not just raise discount volume."
            />
            <div className="mt-8 grid gap-4">
              {offers.map((offer) => (
                <article key={offer.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="section-eyebrow">{offer.status}</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{offer.name}</h2>
                      <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{offer.headline}</p>
                    </div>
                    <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
                      Ends {formatVenueDate(offer.endsAt)}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-2 text-sm text-[var(--ink-soft)]">
                    <p>{offer.audience}</p>
                    <p>{offer.slotScope}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[rgba(31,106,84,0.12)] px-3 py-2 text-sm text-[var(--accent-green)]">
                      Cap {offer.redemptionCap}
                    </span>
                    {offer.status !== "expired" ? (
                      <button
                        type="button"
                        className="primary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => bookFromOffer(offer.id))}
                      >
                        Use this offer
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Membership plans</p>
              <div className="mt-5 grid gap-4">
                {membershipPlans.map((plan) => (
                  <div key={plan.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[var(--accent-green)]" />
                      <p className="font-medium">{plan.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{formatIndianCurrency(plan.monthlyPriceInr)} / month</p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{plan.perks[0]}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Pack shelf</p>
              <div className="mt-5 grid gap-4">
                {packProducts.map((pack) => (
                  <div key={pack.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-[var(--accent)]" />
                      <p className="font-medium">{pack.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {formatIndianCurrency(pack.priceInr)} for {pack.includedCredits} credits
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{pack.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
