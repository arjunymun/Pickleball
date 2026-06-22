"use client";

import { useMemo, useState } from "react";
import { ChartColumnIncreasing, RotateCcw, Sparkles, Ticket, Users2 } from "lucide-react";

import { DemoReadOnlyBanner } from "@/components/admin/demo-readonly-banner";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate } from "@/lib/formatters";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const READ_ONLY_TOOLTIP = "Disabled in read-only demo. Visit /demo/operator for the interactive walkthrough.";

const initialNotice: NoticeState = {
  tone: "info",
  message: "The commercial side in one place: live offers, how the packs are selling, and the member plans.",
};

export function AdminOffersPage() {
  const { addWalletCredit, adminDashboard, catalog, isReadOnlyDemo, resetDemoState, sendCommunication } =
    useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const primaryRecoveryTarget = useMemo(() => adminDashboard.atRiskCustomers[0] ?? null, [adminDashboard.atRiskCustomers]);

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

  return (
    <div className="pt-8">
      {isReadOnlyDemo ? (
        <div className="mb-8">
          <DemoReadOnlyBanner />
        </div>
      ) : null}
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Offer control</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Offers that pull people in, not down.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Live offers, how the packs are selling, the member plans, and quick recovery nudges &mdash; the commercial
              calls the front desk makes between games.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Offers redeemed</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.metrics.offersRedeemed}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Credits expiring</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.metrics.creditsExpiringSoon}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">At-risk audience</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.atRiskCustomers.length}</p>
              </article>
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">Recommended next send</p>
            {primaryRecoveryTarget ? (
              <article className="mt-5 rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  {primaryRecoveryTarget.user.name}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  Sunrise recovery credit
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {primaryRecoveryTarget.daysSinceLastAttendance} days inactive / {primaryRecoveryTarget.profile.favoriteWindow}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{primaryRecoveryTarget.note?.body}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="primary-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isReadOnlyDemo}
                    title={isReadOnlyDemo ? READ_ONLY_TOOLTIP : undefined}
                    onClick={() =>
                      runAction(() =>
                        addWalletCredit(
                          primaryRecoveryTarget.profile.id,
                          200,
                          `Recovery offer credit issued to ${primaryRecoveryTarget.user.name}`,
                        ),
                      )
                    }
                  >
                    Issue {formatIndianCurrency(200)} credit
                  </button>
                  <button
                    type="button"
                    className="secondary-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isReadOnlyDemo}
                    title={isReadOnlyDemo ? READ_ONLY_TOOLTIP : undefined}
                    onClick={() =>
                      runAction(() =>
                        sendCommunication(
                          primaryRecoveryTarget.profile.id,
                          "template-sunrise-recovery",
                          `Recovery WhatsApp prepared for ${primaryRecoveryTarget.user.name}.`,
                        ),
                      )
                    }
                  >
                    Queue WhatsApp
                  </button>
                  <span className="inline-flex items-center rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm text-[var(--ink-soft)]">
                    Recovery playbook
                  </span>
                </div>
              </article>
            ) : (
              <article className="mt-5 rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 p-5">
                <p className="text-sm leading-7 text-[var(--ink-soft)]">
                  No at-risk player is active right now. Reset the demo or move bookings around to repopulate the recovery list.
                </p>
              </article>
            )}
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
              <p className="section-eyebrow">Live commercial state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <button
              type="button"
              className="secondary-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReadOnlyDemo}
              title={isReadOnlyDemo ? READ_ONLY_TOOLTIP : undefined}
              onClick={() => runAction(resetDemoState)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Campaign board"
              title="Every offer with its who and when."
              description="Know why each offer is running, not just that a discount is on."
            />
            <div className="mt-8 grid gap-4">
              {catalog.offers.map((offer) => (
                <article key={offer.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex items-center gap-3">
                    {offer.status === "active" ? (
                      <ChartColumnIncreasing className="h-5 w-5 text-[var(--accent-green)]" />
                    ) : offer.status === "scheduled" ? (
                      <Ticket className="h-5 w-5 text-[var(--accent)]" />
                    ) : (
                      <Users2 className="h-5 w-5 text-[var(--ink-soft)]" />
                    )}
                    <p className="section-eyebrow">{offer.status}</p>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{offer.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{offer.headline}</p>
                  <div className="mt-5 grid gap-2 text-sm text-[var(--ink-soft)]">
                    <p>{offer.audience}</p>
                    <p>{offer.slotScope}</p>
                    <p>
                      {formatVenueDate(offer.startsAt)} to {formatVenueDate(offer.endsAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Pack products</p>
              <div className="mt-5 grid gap-4">
                {catalog.packProducts.map((pack) => (
                  <div key={pack.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-[var(--accent)]" />
                      <p className="font-medium">{pack.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {formatIndianCurrency(pack.priceInr)} / {pack.includedCredits} credits / {pack.validDays} days
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Membership products</p>
              <div className="mt-5 grid gap-4">
                {catalog.membershipPlans.map((plan) => (
                  <div key={plan.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[var(--accent-green)]" />
                      <p className="font-medium">{plan.name}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {formatIndianCurrency(plan.monthlyPriceInr)} / month / {plan.includedCredits} included credits
                    </p>
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
