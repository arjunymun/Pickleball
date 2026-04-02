import { CalendarRange, ChartColumnIncreasing, Coins, Clock3, Ticket, Users2 } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatIndianCurrency, formatPercent, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import {
  adminCustomers,
  adminSummary,
  atRiskCustomers,
  highlightedSlots,
  offers,
  operatorFeed,
} from "@/lib/mock-data";

const adminMetrics = [
  {
    label: "Repeat-play rate",
    value: formatPercent(adminSummary.repeatPlayRate),
    detail: "Customers with more than one booking this cycle.",
  },
  {
    label: "Occupancy",
    value: formatPercent(adminSummary.occupancyRate),
    detail: "Confirmed and completed bookings against the live slot set.",
  },
  {
    label: "Credits expiring",
    value: `${adminSummary.creditsExpiringSoon}`,
    detail: "Pack balances that should trigger a retention touchpoint.",
  },
  {
    label: "Offer response",
    value: `${adminSummary.offersRedeemedThisCycle}`,
    detail: "Tracked redemptions in the current promo cycle.",
  },
];

export default function AdminPage() {
  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Operator OS</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Retention, court control, and customer value in one operating surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              This is the part of Sideout that makes the product different from a standard booking app. It gives a
              real venue visibility into repeat behavior, expiring value, and the offers most likely to change demand.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {adminMetrics.slice(0, 2).map((metric) => (
                <article key={metric.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="section-eyebrow !text-white/45">{metric.label}</p>
                  <p className="metric-value mt-3 text-white">{metric.value}</p>
                  <p className="mt-3 text-sm leading-7 text-white/65">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">What staff sees next</p>
            <div className="mt-5 grid gap-4">
              {operatorFeed.map((item, index) => (
                <article key={item} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-4">
                  <div className="flex items-start gap-4">
                    <span className="mono-detail rounded-full bg-[var(--background-strong)] px-3 py-2 text-[var(--ink-soft)]">
                      0{index + 1}
                    </span>
                    <p className="text-sm leading-7 text-[var(--ink-soft)]">{item}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
        <Reveal delay={0.06}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Schedule control"
              title="Slot templates, review holds, and prime-time inventory on one board."
              description="The schedule layer is not just a calendar. It tells staff which inventory is still open, which holds need a human decision, and where revenue or utilization can move."
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
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span
                        className={`rounded-full px-3 py-1 ${
                          slot.availabilityState === "open" ? "status-open" : "status-limited"
                        }`}
                      >
                        {slot.availabilityState}
                      </span>
                      <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-[var(--ink-soft)]">
                        {slot.confirmationMode}
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

        <Reveal delay={0.1}>
          <div className="grid gap-5">
            {adminMetrics.slice(2).map((metric) => (
              <article key={metric.label} className="surface-card rounded-[2rem] p-6">
                <p className="section-eyebrow">{metric.label}</p>
                <p className="metric-value mt-4">{metric.value}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{metric.detail}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-dark rounded-[2rem] p-6">
            <p className="section-eyebrow !text-white/55">At-risk customers</p>
            <div className="mt-5 grid gap-4">
              {atRiskCustomers.map((entry) => (
                <article key={entry.profile.id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{entry.user.name}</p>
                      <p className="mt-2 text-sm text-white/70">
                        {entry.profile.favoriteWindow} - {entry.daysSinceLastAttendance} days inactive
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                      {entry.profile.tags[0]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/72">{entry.note?.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Customer intelligence"
              title="Profiles that stay useful after the booking is made."
              description="Owners and staff can see who belongs to which rhythm: prime-time regulars, offer-responsive members, pack holders about to lapse, and new players worth nurturing."
            />
            <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-[var(--line-soft)] bg-white/65">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr] gap-4 border-b border-[var(--line-soft)] px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                <span>Customer</span>
                <span>Window</span>
                <span>Product</span>
                <span>Credits</span>
              </div>
              {adminCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr] gap-4 border-b border-[var(--line-soft)] px-4 py-4 text-sm last:border-none"
                >
                  <div>
                    <p className="font-medium text-[var(--ink-strong)]">{customer.name}</p>
                    <p className="mt-1 text-[var(--ink-soft)]">{customer.totalBookings} total bookings</p>
                  </div>
                  <div className="text-[var(--ink-soft)]">{customer.favoriteWindow}</div>
                  <div className="text-[var(--ink-soft)]">{customer.membership}</div>
                  <div className="text-[var(--ink-soft)]">{customer.creditsRemaining}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mt-8">
        <Reveal delay={0.14}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Offer control"
              title="Promotions with audience, timing, and slot intent attached."
              description="The operator should know which offer is live, who it is aimed at, and why it exists in the schedule, especially when the product is optimizing repeat play instead of one-off discount volume."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 p-5">
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
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{offer.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{offer.headline}</p>
                  <div className="mt-5 grid gap-2 text-sm text-[var(--ink-soft)]">
                    <p>{offer.audience}</p>
                    <p>{offer.slotScope}</p>
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
