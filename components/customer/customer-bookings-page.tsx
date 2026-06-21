"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Clock3,
  CreditCard,
  Filter,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { formatIndianCurrency, formatVenueDate, formatVenueRange, formatVenueTime } from "@/lib/formatters";
import { formatModeLabel, getAvailabilityClasses, getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message:
    "We hold the court for you first, then take payment — so two people can never grab the same slot at once.",
};

function getDateKey(value: string) {
  return value.slice(0, 10);
}

export function CustomerBookingsPage() {
  const {
    adminDashboard,
    auth,
    bookSlot,
    cancelBooking,
    capabilities,
    customerExperience,
    isSupabaseConfigured,
    resetDemoState,
    runtimeSource,
    setup,
    startBookingCheckout,
  } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const courtLookup = useMemo(
    () => new Map(adminDashboard.courts.map((court) => [court.id, court])),
    [adminDashboard.courts],
  );

  const getCourtLabel = useCallback((courtId: string) => courtLookup.get(courtId)?.name ?? "Court", [courtLookup]);

  const openSlots = useMemo(
    () => customerExperience.slots.filter((entry) => entry.canBook),
    [customerExperience.slots],
  );

  const dateOptions = useMemo(() => {
    const uniqueDates = new Map<string, string>();
    openSlots.forEach((entry) => {
      const key = getDateKey(entry.slot.startsAt);
      uniqueDates.set(key, formatVenueDate(entry.slot.startsAt));
    });
    return Array.from(uniqueDates, ([value, label]) => ({ value, label }));
  }, [openSlots]);

  const courtOptions = useMemo(() => {
    const uniqueCourts = new Map<string, string>();
    openSlots.forEach((entry) => {
      uniqueCourts.set(entry.slot.courtId, getCourtLabel(entry.slot.courtId));
    });
    return Array.from(uniqueCourts, ([value, label]) => ({ value, label }));
  }, [getCourtLabel, openSlots]);

  const filteredOpenSlots = useMemo(
    () =>
      openSlots.filter((entry) => {
        const matchesDate = selectedDate === "all" || getDateKey(entry.slot.startsAt) === selectedDate;
        const matchesCourt = selectedCourt === "all" || entry.slot.courtId === selectedCourt;
        return matchesDate && matchesCourt;
      }),
    [openSlots, selectedCourt, selectedDate],
  );

  const focusedSlot =
    filteredOpenSlots.find((entry) => entry.slot.id === selectedSlotId) ?? filteredOpenSlots[0] ?? null;

  // When Supabase is configured but the active runtime is not the live supabase source,
  // the visitor is on the live deployment while signed out / not bootstrapped. bookSlot
  // would throw in that state, so disable the Book buttons and prompt sign-in instead of
  // letting the click fail.
  const requiresSignIn = isSupabaseConfigured && runtimeSource !== "supabase";

  // The board used to hard-code "May". Derive the label from the inventory actually on
  // screen (the earliest open slot's month), and fall back to the current month when no
  // slots are loaded, so the filter never advertises a stale month.
  const inventoryMonthLabel = useMemo(() => {
    const formatMonth = (iso: string) =>
      new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "Asia/Kolkata" }).format(
        new Date(iso),
      );
    const earliest = openSlots
      .map((entry) => entry.slot.startsAt)
      .sort((a, b) => a.localeCompare(b))[0];
    return earliest ? formatMonth(earliest) : formatMonth(new Date().toISOString());
  }, [openSlots]);

  const liveAccessMessage =
    auth.status === "signed_out"
      ? "Sign in from the live access page to load customer availability and create real holds."
      : setup.status !== "live"
        ? "Initialize the live venue after sign-in so Sideout can load courts, slots, and customer profiles."
        : capabilities.customerLive
          ? "Live customer profile connected."
          : "This account is signed in but does not yet have a customer profile for the active venue.";

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
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="section-eyebrow">Court booking</p>
              <span className="rounded-full border border-[rgba(31,106,84,0.18)] bg-[rgba(31,106,84,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                {inventoryMonthLabel} live board
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
              Book a court with a real hold.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
              Pick a {inventoryMonthLabel} slot, reserve it for checkout, and keep the operator schedule in sync. The frontend only calls
              booking APIs; conflict checks and payment state live on the server.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] p-4">
                <p className="section-eyebrow">Upcoming</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {customerExperience.upcomingBookings.length}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Bookings tied to this account</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] p-4">
                <p className="section-eyebrow">Available</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{openSlots.length}</p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Slots open after holds and blocks</p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] p-4">
                <p className="section-eyebrow">Wallet</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {formatIndianCurrency(customerExperience.walletBalance)}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Credits available for eligible courts</p>
              </article>
            </div>
          </div>

          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow !text-white/55">Booking engine</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Temporary holds protect inventory</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  A booking starts as a hold, then becomes confirmed only after the server-side payment or review path
                  completes.
                </p>
              </article>
              <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-white/80" />
                  <p className="font-medium text-white">Operator state updates immediately</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Customer holds, cancellations, and checkout states flow into the same schedule used by staff.
                </p>
              </article>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Live status</p>
                <p className="mt-3 text-sm leading-7 text-white/72">{liveAccessMessage}</p>
                {auth.status === "signed_out" ? (
                  <a href="/sign-in" className="secondary-button secondary-button-dark mt-4 w-fit px-4 py-2 text-sm">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
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
              <p className="section-eyebrow">Booking state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            {runtimeSource === "demo" ? (
              <button
                type="button"
                className="secondary-button px-4 py-2 text-sm"
                onClick={() => runAction(resetDemoState)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset walkthrough
              </button>
            ) : null}
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <Reveal delay={0.08}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Filters"
              title="Choose date, court, and payment path."
              description={`The board narrows ${inventoryMonthLabel} inventory without hiding the booking rules behind the UI.`}
            />
            <div className="mt-7 grid gap-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-strong)]">
                  <Filter className="h-4 w-4" />
                  Date
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedDate === "all"
                        ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-white"
                        : "border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] text-[var(--ink-soft)]"
                    }`}
                    onClick={() => setSelectedDate("all")}
                  >
                    All {inventoryMonthLabel} slots
                  </button>
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedDate === option.value
                          ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-white"
                          : "border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] text-[var(--ink-soft)]"
                      }`}
                      onClick={() => setSelectedDate(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-strong)]">
                  <MapPin className="h-4 w-4" />
                  Court
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedCourt === "all"
                        ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-white"
                        : "border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] text-[var(--ink-soft)]"
                    }`}
                    onClick={() => setSelectedCourt("all")}
                  >
                    All courts
                  </button>
                  {courtOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedCourt === option.value
                          ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-white"
                          : "border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] text-[var(--ink-soft)]"
                      }`}
                      onClick={() => setSelectedCourt(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] p-5">
                <p className="section-eyebrow">Selected slot</p>
                {focusedSlot ? (
                  <div className="mt-4 grid gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                        {focusedSlot.slot.label}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {formatVenueDate(focusedSlot.slot.startsAt)} at {formatVenueTime(focusedSlot.slot.startsAt)}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-[var(--ink-soft)]">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {getCourtLabel(focusedSlot.slot.courtId)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatVenueRange(focusedSlot.slot.startsAt, focusedSlot.slot.endsAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {formatIndianCurrency(focusedSlot.slot.priceInr)} · {formatModeLabel(focusedSlot.slot.paymentMode)}
                      </span>
                    </div>
                    {requiresSignIn ? (
                      <div className="w-fit rounded-[1rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] px-4 py-3 text-sm text-[var(--ink-soft)]">
                        <a href="/sign-in" className="font-semibold text-[var(--accent-deep)] underline">
                          Sign in to book
                        </a>{" "}
                        and initialize live mode to create a real hold.
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="primary-button w-fit px-4 py-2 text-sm"
                        onClick={() => runAction(() => bookSlot(focusedSlot.slot.id))}
                      >
                        {focusedSlot.cta}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    No slots match this filter yet. Change the date or court, or sign in to load live inventory.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface-card-dark rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Availability"
              title={`${inventoryMonthLabel} court inventory.`}
              description="Tap a slot to inspect it, then create a hold from the summary or directly from the slot card."
              invert
            />
            <div className="mt-8 grid gap-3 lg:grid-cols-2">
              {filteredOpenSlots.length > 0 ? (
                filteredOpenSlots.map((entry) => {
                  const isFocused = focusedSlot?.slot.id === entry.slot.id;

                  return (
                    <article
                      key={entry.slot.id}
                      className={`rounded-[1.35rem] border p-4 transition ${
                        isFocused
                          ? "border-white/35 bg-white/12"
                          : "border-white/10 bg-white/5 hover:border-white/24 hover:bg-white/8"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setSelectedSlotId(entry.slot.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                              {formatVenueDate(entry.slot.startsAt)}
                            </p>
                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                              {entry.slot.label}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-white/68">
                              {formatVenueRange(entry.slot.startsAt, entry.slot.endsAt)} · {getCourtLabel(entry.slot.courtId)}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs ${getAvailabilityClasses(entry.slot.availabilityState)}`}>
                            {entry.slot.availabilityState}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-white/76">
                            {formatIndianCurrency(entry.slot.priceInr)}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-white/76">
                            {entry.slot.confirmationMode === "review" ? "Operator review" : "Instant hold"}
                          </span>
                          {entry.canUseWallet ? (
                            <span className="rounded-full bg-[rgba(31,106,84,0.28)] px-3 py-1 text-white">
                              Credits eligible
                            </span>
                          ) : null}
                        </div>
                      </button>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                        <p className="text-xs leading-5 text-white/55">
                          {requiresSignIn
                            ? "Sign in and initialize live mode to book this slot."
                            : entry.slot.confirmationMode === "review"
                              ? "Request lands in the staff queue."
                              : "Hold opens a payment-safe checkout path."}
                        </p>
                        {requiresSignIn ? (
                          <a
                            href="/sign-in"
                            className="secondary-button secondary-button-dark px-4 py-2 text-sm"
                          >
                            Sign in to book
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="secondary-button secondary-button-dark px-4 py-2 text-sm"
                            onClick={() => runAction(() => bookSlot(entry.slot.id))}
                          >
                            {entry.cta}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="rounded-[1.35rem] border border-white/10 bg-white/5 p-5 lg:col-span-2">
                  <p className="text-sm leading-7 text-white/70">
                    No live slots are available for this filter. Sign in, initialize the venue if needed, or adjust the
                    date and court filters.
                  </p>
                </article>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal delay={0.16}>
        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface-card-dark rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Upcoming"
              title="Your confirmed and pending courts."
              description="Cancel eligible bookings here. Staff sees the release in the operator schedule."
              invert
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
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/78">
                          {formatModeLabel(booking.status)}
                        </span>
                        <button
                          type="button"
                          className="secondary-button secondary-button-dark px-4 py-2 text-sm"
                          onClick={() => runAction(() => cancelBooking(booking.id))}
                        >
                          Cancel
                        </button>
                        {["supabase", "demo"].includes(runtimeSource) && ["held", "payment_pending"].includes(booking.status) ? (
                          <button
                            type="button"
                            className="primary-button px-4 py-2 text-sm"
                            onClick={() => runAction(() => startBookingCheckout(booking.id))}
                          >
                            Checkout
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-7 text-white/70">
                    Your upcoming bookings will appear here after you create a hold or confirm a court.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="How booking works"
              title="What happens after you press book."
              description="We hold the court for you, you pay, and it's confirmed. If you don't finish checkout, the slot goes straight back up for someone else."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["1", "Hold", "Your court and time are locked while you check out."],
                ["2", "Pay", "Card payment opens only for your own booking."],
                ["3", "Confirmed", "Once the payment clears, the court is yours."],
              ].map(([step, title, body]) => (
                <article key={step} className="rounded-[1.3rem] border border-[var(--line-soft)] bg-white/70 dark:bg-white/[0.06] p-4">
                  <p className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ink-strong)] text-sm font-semibold text-white">
                    {step}
                  </p>
                  <p className="mt-4 font-semibold text-[var(--ink-strong)]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
