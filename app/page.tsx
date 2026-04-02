import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Clock3,
  Coins,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Wordmark } from "@/components/ui/wordmark";
import { formatIndianCurrency, formatPercent, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import {
  adminSummary,
  atRiskCustomers,
  courts,
  highlightedSlots,
  membershipPlans,
  offers,
  packProducts,
  venue,
} from "@/lib/mock-data";
import { site } from "@/lib/site";

const productPillars = [
  {
    title: "Guest browse, member depth",
    copy:
      "Availability, offers, and pricing can be explored without friction. The moment someone wants to book or buy, the product tightens around identity, credits, and repeat-play value.",
  },
  {
    title: "Bookings with business logic",
    copy:
      "Some slots confirm instantly, some route through staff review, and cancellation value returns as credit instead of defaulting to a refund. The product respects how real venues actually operate.",
  },
  {
    title: "Retention as a first-class surface",
    copy:
      "The operator view is not just occupancy charts. It surfaces expiring value, at-risk players, offer response, and the customers most likely to convert again.",
  },
];

export default function HomePage() {
  return (
    <main className="page-frame">
      <section className="relative overflow-hidden px-6 pb-20 pt-6 sm:px-8 lg:px-12">
        <div className="hero-glow left-[5%] top-20 h-56 w-56 bg-[rgba(31,106,84,0.22)]" />
        <div className="hero-glow right-[8%] top-36 h-64 w-64 bg-[rgba(221,105,56,0.22)]" />
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-5 border-b border-[var(--line-soft)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <Wordmark />
            <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--ink-soft)]">
              {site.nav.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[var(--ink-strong)]">
                  {item.label}
                </Link>
              ))}
              <Link href="/app" className="secondary-button px-4 py-2 text-sm">
                Customer preview
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-16">
            <Reveal className="max-w-3xl">
              <p className="section-eyebrow">Premium club, warm roots</p>
              <h1 className="display-font text-balance mt-5 text-6xl font-medium leading-[0.92] tracking-[-0.06em] text-[var(--ink-strong)] sm:text-7xl lg:text-[5.5rem]">
                Pickleball software that feels like a premium venue, not a template dashboard.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                Sideout is a repeat-play club OS built around a real family-run venue in {venue.location}. It combines
                guest-friendly booking, memberships, packs, and offers with an operator console designed to keep courts
                full and customers coming back.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/app" className="primary-button">
                  Explore the customer app
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/admin" className="secondary-button">
                  View the operator OS
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="section-eyebrow">Venue</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{courts.length} courts</p>
                </div>
                <div>
                  <p className="section-eyebrow">Repeat play</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    {formatPercent(adminSummary.repeatPlayRate)}
                  </p>
                </div>
                <div>
                  <p className="section-eyebrow">Offer response</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    {adminSummary.offersRedeemedThisCycle} redemptions
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="surface-card-dark relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
                <div className="hero-court-lines absolute inset-0 opacity-25" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mono-detail text-white/55">Tonight at Sideout</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                        Peak-hour courts with member-aware pricing.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/70">Live preview</div>
                  </div>

                  <div className="mt-8 grid gap-4">
                    {highlightedSlots.slice(0, 3).map((slot) => (
                      <article
                        key={slot.id}
                        className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="mono-detail text-white/50">{formatVenueDate(slot.startsAt)}</p>
                            <h2 className="mt-2 text-xl font-semibold">{slot.label}</h2>
                            <p className="mt-2 text-sm text-white/70">{formatVenueRange(slot.startsAt, slot.endsAt)}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              slot.availabilityState === "open" ? "status-open" : "status-review"
                            }`}
                          >
                            {slot.availabilityState === "open" ? "Open" : "Limited"}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm text-white/68">
                          <span>{formatIndianCurrency(slot.priceInr)}</span>
                          <span>{slot.paymentMode.replaceAll("_", " ")}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12" delay={0.04}>
        <section id="story" className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <SectionHeading
            eyebrow="Why it feels different"
            title="A productized venue, not a sports-tech clone."
            description={venue.story}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {productPillars.map((pillar, index) => (
              <article key={pillar.title} className="surface-card rounded-[1.8rem] p-6">
                <p className="mono-detail text-[var(--ink-soft)]">0{index + 1}</p>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                  {pillar.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <section id="availability" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHeading
            eyebrow="Availability"
            title="The customer surface sells convenience before it asks for trust."
            description="Users can browse real court windows, compare slot rules, and see pricing without hitting an auth wall. That first impression matters when this site is also your venue storefront."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal delay={0.06}>
            <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Guest browsing</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Slot cards built for quick decisions.</h3>
                </div>
                <div className="inline-flex rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm text-[var(--ink-soft)]">
                  Asia/Kolkata
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                {highlightedSlots.map((slot) => (
                  <article
                    key={slot.id}
                    className="rounded-[1.6rem] border border-[var(--line-soft)] bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="mono-detail text-[var(--ink-soft)]">{formatVenueDate(slot.startsAt)}</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{slot.label}</h3>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatVenueRange(slot.startsAt, slot.endsAt)} on{" "}
                          {courts.find((court) => court.id === slot.courtId)?.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            slot.availabilityState === "open" ? "status-open" : "status-limited"
                          }`}
                        >
                          {slot.availabilityState}
                        </span>
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
                          {slot.confirmationMode === "instant" ? "Instant confirm" : "Manual review"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                        <Clock3 className="h-4 w-4" />
                        {slot.durationMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                        <Coins className="h-4 w-4" />
                        {formatIndianCurrency(slot.priceInr)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--background-strong)] px-3 py-2">
                        <CalendarRange className="h-4 w-4" />
                        {slot.paymentMode.replaceAll("_", " ")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid gap-5">
              <div className="surface-card rounded-[2rem] p-6">
                <p className="section-eyebrow">What the venue is selling</p>
                <ul className="mt-5 grid gap-4">
                  <li className="rounded-[1.3rem] bg-white/65 p-4">
                    <div className="flex items-center gap-3">
                      <Users2 className="h-5 w-5 text-[var(--accent-green)]" />
                      <p className="font-medium">Court slots with mixed confirmation rules</p>
                    </div>
                  </li>
                  <li className="rounded-[1.3rem] bg-white/65 p-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                      <p className="font-medium">Offers that target repeat play, not blanket discounting</p>
                    </div>
                  </li>
                  <li className="rounded-[1.3rem] bg-white/65 p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[var(--accent-gold)]" />
                      <p className="font-medium">Credits and pack restoration instead of default cash refunds</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="surface-card-dark rounded-[2rem] p-6">
                <p className="section-eyebrow !text-white/55">Venue note</p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Designed for real court media later, but already strong without it.
                </p>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
                  The layout leaves room for future sunrise footage, court-side photography, and real Dehradun venue
                  textures without depending on them today.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="memberships" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHeading
            eyebrow="Memberships, packs, and offers"
            title="Value products should feel desirable, not tacked onto the booking flow."
            description="Sideout treats packs, memberships, and targeted credits as part of the venue identity. That makes the customer experience richer and gives the operator meaningful retention levers."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_0.55fr_0.55fr]">
          {membershipPlans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.05}>
              <article className="surface-card-strong rounded-[2rem] p-6">
                <p className="section-eyebrow">{index === 0 ? "Membership" : "Premium tier"}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{plan.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {formatIndianCurrency(plan.monthlyPriceInr)} per month with {plan.includedCredits} included credits.
                </p>
                <ul className="mt-5 grid gap-3">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="rounded-[1.2rem] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
                      {perk}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}

          {packProducts.map((pack, index) => (
            <Reveal key={pack.id} delay={0.1 + index * 0.05}>
              <article className="surface-card rounded-[2rem] p-6">
                <p className="section-eyebrow">Pack</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{pack.name}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{pack.description}</p>
                <div className="mt-6 flex items-end justify-between">
                  <p className="metric-value">{pack.includedCredits}</p>
                  <div className="text-right">
                    <p className="mono-detail text-[var(--ink-soft)]">Credits</p>
                    <p className="mt-1 text-lg font-semibold">{formatIndianCurrency(pack.priceInr)}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8" delay={0.12}>
          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.id} className="surface-card rounded-[1.6rem] p-5">
                <p className="section-eyebrow">{offer.status}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{offer.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{offer.headline}</p>
                <div className="mt-5 text-sm text-[var(--ink-soft)]">
                  <p>{offer.audience}</p>
                  <p className="mt-1">{offer.slotScope}</p>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="operator-os" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHeading
            eyebrow="Operator OS"
            title="The admin side is where retention, spend, and schedule quality come together."
            description="This is the wedge that makes the product portfolio-worthy. The venue gets more than booking management: it gets signals about who is slipping away, what value is expiring, and where the next offer should go."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <Reveal delay={0.05}>
            <div className="surface-card-dark rounded-[2rem] p-6">
              <p className="section-eyebrow !text-white/55">Operator pulse</p>
              <div className="mt-6 grid gap-4">
                <article className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
                  <p className="mono-detail text-white/50">Occupancy</p>
                  <p className="metric-value mt-2 text-white">{formatPercent(adminSummary.occupancyRate)}</p>
                </article>
                <article className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
                  <p className="mono-detail text-white/50">Repeat play</p>
                  <p className="metric-value mt-2 text-white">{formatPercent(adminSummary.repeatPlayRate)}</p>
                </article>
                <article className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
                  <p className="mono-detail text-white/50">Credits expiring</p>
                  <p className="metric-value mt-2 text-white">{adminSummary.creditsExpiringSoon}</p>
                </article>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="surface-card-strong rounded-[2rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Retention surface</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                    Customers who need a nudge, not another spreadsheet.
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--accent)]">
                  <MapPin className="h-4 w-4" />
                  {venue.location}
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                {atRiskCustomers.map((entry) => (
                  <article key={entry.profile.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xl font-semibold tracking-[-0.03em]">{entry.user.name}</p>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {entry.profile.favoriteWindow} player - last seen {entry.daysSinceLastAttendance} days ago
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
                        {entry.profile.tags[0]}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{entry.note?.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-6 pb-24 pt-8 sm:px-8 lg:px-12">
        <section className="surface-card-dark rounded-[2.4rem] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="section-eyebrow !text-white/55">Ready on localhost</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                One product. Three surfaces. Enough fidelity to review like a real flagship build.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                The marketing, customer, and operator experiences all share one brand system and one domain model, so
                the work reads like a product from the first page down to the last retention table.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/app" className="primary-button">
                Open customer app
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin" className="secondary-button secondary-button-dark">
                Open admin console
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
