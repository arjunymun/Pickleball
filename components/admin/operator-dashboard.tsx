"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChartColumnIncreasing, Coins, Clock3, RotateCcw, Ticket, Users2 } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBlockingBookingForSlot } from "@/lib/demo-state";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatPercent, formatVenueDate, formatVenueRange } from "@/lib/formatters";
import { bookableSlots, courts, customerProfiles, offers, PREVIEW_CUSTOMER_ID, users } from "@/lib/mock-data";
import { formatModeLabel, getAvailabilityClasses, getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const courtLookup = new Map(courts.map((court) => [court.id, court]));
const customerNameLookup = new Map(
  customerProfiles.map((profile) => [profile.id, users.find((user) => user.id === profile.userId)?.name ?? "Sideout player"]),
);

const initialNotice: NoticeState = {
  tone: "info",
  message: "This operator console shares the same demo state as /app. Booking, approval, and credit actions all persist across both experiences.",
};

export function OperatorDashboard() {
  const { addWalletCredit, adminDashboard, approveBooking, resetDemoState, state } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

  const schedule = useMemo(
    () =>
      bookableSlots.map((slot) => {
        const blockingBooking = getBlockingBookingForSlot(state, slot.id);

        return {
          slot,
          blockingBooking,
          effectiveAvailability: blockingBooking ? "booked" : slot.availabilityState,
          customerName: blockingBooking ? customerNameLookup.get(blockingBooking.customerId) ?? "Sideout player" : null,
          court: courtLookup.get(slot.courtId),
        };
      }),
    [state],
  );

  const adminMetrics = [
    {
      label: "Repeat-play rate",
      value: formatPercent(adminDashboard.metrics.repeatPlayRate),
      detail: "Customers with more than one booking this cycle.",
    },
    {
      label: "Occupancy",
      value: formatPercent(adminDashboard.metrics.occupancyRate),
      detail: "Confirmed and completed bookings against the live slot set.",
    },
    {
      label: "Credits expiring",
      value: `${adminDashboard.metrics.creditsExpiringSoon}`,
      detail: "Pack balances that should trigger a retention touchpoint.",
    },
    {
      label: "Offer response",
      value: `${adminDashboard.metrics.offersRedeemed}`,
      detail: "Tracked redemptions in the current promo cycle.",
    },
  ];

  const previewCustomer = adminDashboard.customers.find((customer) => customer.id === PREVIEW_CUSTOMER_ID);

  function runAction(action: () => string) {
    try {
      setNotice({
        tone: "success",
        message: action(),
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
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Operator OS</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Retention, approvals, and customer value in one operating surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              This is where Sideout becomes more than a booking clone. Staff gets a live queue, customer intelligence,
              and commercial actions that can change behavior without leaving the venue workflow.
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
            <p className="section-eyebrow">Live request queue</p>
            <div className="mt-5 grid gap-4">
              {adminDashboard.requestQueue.length > 0 ? (
                adminDashboard.requestQueue.map((entry) => (
                  <article
                    key={entry.booking.id}
                    className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                          {entry.customer.name}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{entry.slot.label}</h2>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatVenueDate(entry.slot.startsAt)} / {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--ink-soft)]">
                          {formatModeLabel(entry.booking.paymentStatus)} / {formatIndianCurrency(entry.slot.priceInr)}
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
                <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-4">
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">
                    No live holds are waiting right now. Book a review-based slot from the customer side to repopulate
                    this queue.
                  </p>
                </article>
              )}
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
              <p className="section-eyebrow">Live operator state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-medium text-[var(--accent)]">
                Shared with customer app
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

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
        <Reveal delay={0.06}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Schedule control"
              title="Slot templates, queue context, and live inventory on one board."
              description="The schedule layer is not just a calendar. It tells staff which courts are free, which ones are already held, and where an approval or recovery action changes the day."
            />
            <div className="mt-8 grid gap-4">
              {schedule.map((entry) => (
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
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-7 text-[var(--ink-soft)]">
                      {entry.blockingBooking
                        ? `${entry.customerName} currently holds this court in a ${entry.blockingBooking.status} booking state.`
                        : "Inventory is still open for the customer flow and can convert directly into the next confirmed booking."}
                    </p>
                    {entry.blockingBooking?.status === "requested" ? (
                      <button
                        type="button"
                        className="secondary-button px-4 py-2 text-sm"
                        onClick={() => runAction(() => approveBooking(entry.blockingBooking!.id))}
                      >
                        Approve
                      </button>
                    ) : entry.blockingBooking ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--background-strong)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
                        Customer held
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

        <Reveal delay={0.1}>
          <div className="grid gap-5">
            {adminMetrics.slice(2).map((metric) => (
              <article key={metric.label} className="surface-card rounded-[2rem] p-6">
                <p className="section-eyebrow">{metric.label}</p>
                <p className="metric-value mt-4">{metric.value}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{metric.detail}</p>
              </article>
            ))}

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Operator controls</p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                Give the customer side a real business action.
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                This adds a recovery credit directly to the preview customer and changes the wallet-based booking path
                back on `/app`.
              </p>
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  className="primary-button px-4 py-2 text-sm"
                  onClick={() =>
                    runAction(() =>
                      addWalletCredit(
                        PREVIEW_CUSTOMER_ID,
                        600,
                        "Sunrise recovery credit added from the operator console",
                      ),
                    )
                  }
                >
                  Add INR 600 to {previewCustomer?.name?.split(" ")[0] ?? "Rhea"}
                </button>
                <button
                  type="button"
                  className="secondary-button px-4 py-2 text-sm"
                  onClick={() => runAction(resetDemoState)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset demo state
                </button>
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Confirmed next</p>
              <div className="mt-5 grid gap-3">
                {adminDashboard.upcomingConfirmed.slice(0, 3).map((entry) => (
                  <div key={entry.booking.id} className="rounded-[1.2rem] bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{entry.customer.name}</p>
                        <p className="mt-1 text-sm text-[var(--ink-soft)]">
                          {entry.slot.label} / {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                        confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </Reveal>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-dark rounded-[2rem] p-6">
            <p className="section-eyebrow !text-white/55">At-risk customers</p>
            <div className="mt-5 grid gap-4">
              {adminDashboard.atRiskCustomers.map((entry) => (
                <article key={entry.profile.id} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{entry.user.name}</p>
                      <p className="mt-2 text-sm text-white/70">
                        {entry.profile.favoriteWindow} / {entry.daysSinceLastAttendance} days inactive
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
              {adminDashboard.customers.map((customer) => (
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
                  <div className="text-[var(--ink-soft)]">{formatIndianCurrency(customer.creditsRemaining)}</div>
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
