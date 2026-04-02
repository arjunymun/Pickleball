import { ArrowRight, CreditCard, ShieldCheck, Sparkles, Ticket } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatIndianCurrency, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import {
  customerPreviewMembership,
  customerPreviewPack,
  customerPreviewProfile,
  customerPreviewUpcomingBookings,
  customerPreviewUser,
  highlightedSlots,
  membershipPlans,
  offers,
  packProducts,
  walletBalance,
  walletLedgerEntries,
} from "@/lib/mock-data";

export default function CustomerPage() {
  const activeMembership = membershipPlans.find((plan) => plan.id === customerPreviewMembership.planId);
  const activePack = packProducts.find((pack) => pack.id === customerPreviewPack.productId);

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
              Guests can explore availability before they log in. Once they do, the product becomes an account layer
              with credits, packs, offers, and future bookings that all point back to repeat play.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Member</p>
                <p className="mt-3 text-xl font-semibold">{customerPreviewUser.name}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{customerPreviewProfile.skillBand}</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Wallet balance</p>
                <p className="mt-3 text-xl font-semibold">{formatIndianCurrency(walletBalance)}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Credits first, cash second</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <p className="section-eyebrow">Favorite window</p>
                <p className="mt-3 text-xl font-semibold">{customerPreviewProfile.favoriteWindow}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Offer targeting stays relevant</p>
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
                  Guests can compare availability, view offers, and understand the venue before they create an account.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Hybrid payment rules</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Some slots require online payment, some allow venue settlement, and some consume credits or pack value.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Cancellation returns value</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Before cutoff, Sideout restores pack value or credit balance instead of treating every cancellation like a refund workflow.
                </p>
              </article>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal delay={0.05}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Availability feed"
              title="Book a court with enough context to trust the decision."
              description="Each slot makes the operational rule legible: duration, payment mode, confirmation path, and price."
            />
            <div className="mt-8 grid gap-4">
              {highlightedSlots.map((slot) => (
                <article key={slot.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="section-eyebrow">{formatVenueDate(slot.startsAt)}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{slot.label}</h2>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">{formatVenueRange(slot.startsAt, slot.endsAt)}</p>
                    </div>
                    <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                      {slot.confirmationMode === "instant" ? "Instant confirm" : "Review required"}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
                    <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">{formatIndianCurrency(slot.priceInr)}</span>
                    <span className="rounded-full bg-[var(--background-strong)] px-3 py-2">
                      {slot.paymentMode.replaceAll("_", " ")}
                    </span>
                    <button className="primary-button ml-auto px-4 py-2 text-sm">
                      Sign in to book
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Wallet</p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{formatIndianCurrency(walletBalance)}</p>
              <div className="mt-5 space-y-3">
                {walletLedgerEntries
                  .filter((entry) => entry.customerId === customerPreviewProfile.id)
                  .map((entry) => (
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
                    <p className="font-medium">{activePack?.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{customerPreviewPack.creditsRemaining} credits remaining</p>
                </div>
                <div className="rounded-[1.3rem] bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[var(--accent-green)]" />
                    <p className="font-medium">{activeMembership?.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    Renews on {formatVenueDate(customerPreviewMembership.renewsAt)}
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
              {customerPreviewUpcomingBookings.map(({ booking, slot }) => (
                <article key={booking.id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{slot.label}</p>
                      <p className="mt-2 text-sm text-white/72">{formatVenueRange(slot.startsAt, slot.endsAt)}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/78">
                      {booking.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Offers"
              title="Promotions that feel targeted, not desperate."
              description="The customer sees reasons to come back. The admin sees which segment, slot type, and redemption pattern is actually moving behavior."
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
