"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, Hourglass, LayoutGrid } from "lucide-react";
import type {
  AcademyBooking,
  AcademySession,
  AvailabilityPayload,
} from "@/lib/academy/contracts";
import {
  academyPost,
  AcademyApiError,
  newIdempotencyKey,
} from "@/lib/academy/client";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import {
  bookingDates,
  formatCourtDate,
  formatCourtTime,
  hourInIndia,
  indiaDate,
  slotStart,
} from "@/lib/academy/time";
import { useCustomerData } from "./customer-data";
import {
  chosenAvailableSlot,
  resolveBookingSelection,
  slotStartsInFuture,
} from "./booking-selection";
import styles from "./academy-customer.module.css";

export function CourtBooking({
  initialDate,
  initialHour,
  initialCourt,
  initialNow,
}: {
  initialDate?: string;
  initialHour?: string;
  initialCourt?: string;
  initialNow?: number;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => initialNow ?? Date.now());
  const [initialSelection] = useState(() =>
    resolveBookingSelection(now, initialDate, initialHour),
  );
  const currentDate = indiaDate(new Date(now));
  const dates = useMemo(
    () => bookingDates(new Date(`${currentDate}T12:00:00+05:30`)),
    [currentDate],
  );
  const [date, setDate] = useState(initialSelection.date);
  const [hour, setHour] = useState(initialSelection.hour);
  const [courtId, setCourtId] = useState(initialCourt ?? "");
  const [notice, setNotice] = useState<string | null>(initialSelection.notice);
  const [busy, setBusy] = useState(false);
  const holdAttempt = useRef<{ selection: string; key: string } | null>(null);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!dates.includes(date)) {
      const next = resolveBookingSelection(now, null, hour);
      setDate(next.date);
      setHour(next.hour);
      setNotice(
        "The booking window has moved forward. Check your selected date and time.",
      );
      window.history.replaceState(
        null,
        "",
        `/book?${new URLSearchParams({ date: next.date, time: next.hour, ...(courtId ? { court: courtId } : {}) })}`,
      );
    }
  }, [date, dates, now, hour, courtId]);
  useEffect(() => {
    function restoreSelection() {
      const params = new URLSearchParams(window.location.search);
      const next = resolveBookingSelection(
        Date.now(),
        params.get("date"),
        params.get("time"),
      );
      setDate(next.date);
      setHour(next.hour);
      setCourtId(params.get("court") ?? "");
      setNotice(next.notice);
    }
    window.addEventListener("popstate", restoreSelection);
    return () => window.removeEventListener("popstate", restoreSelection);
  }, []);
  const inventory = useCustomerData<AvailabilityPayload>(
    `/api/availability?date=${encodeURIComponent(date)}`,
  );
  const session = useCustomerData<AcademySession>("/api/session");
  const slots =
    inventory.data?.slots
      .filter((slot) => hourInIndia(slot.startsAt) === Number(hour))
      .map((slot) => ({
        ...slot,
        available: slot.available && slotStartsInFuture(slot.startsAt, now),
      })) ?? [];
  const selectedCourtId = inventory.data?.courts.some(
    (court) => court.id === courtId,
  )
    ? courtId
    : "";
  const selectedSlot = slots.find((slot) => slot.courtId === selectedCourtId);
  const chosen = chosenAvailableSlot(slots, selectedCourtId);
  const chosenCourt = inventory.data?.courts.find(
    (court) => court.id === chosen?.courtId,
  );
  const selectedCourtName = inventory.data?.courts.find(
    (court) => court.id === courtId,
  )?.name;
  const selectionPath = `/book?${new URLSearchParams({ date, time: hour, ...(chosen ? { court: chosen.courtId } : {}) })}`;
  const displayedPrice = chosen?.pricePaise ?? ACADEMY.courtPricePaise;

  function updateRouteSelection(
    nextDate: string,
    nextHour: string,
    nextCourt: string,
  ) {
    const params = new URLSearchParams({ date: nextDate, time: nextHour });
    if (nextCourt) params.set("court", nextCourt);
    window.history.pushState(null, "", `/book?${params.toString()}`);
  }

  async function holdCourt() {
    if (!chosen || busy || inventory.loading) return;
    if (!slotStartsInFuture(chosen.startsAt)) {
      setNotice(
        "That start time has passed. Refresh availability and choose another time.",
      );
      inventory.refresh();
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (!session.data?.user) {
        router.push(`/sign-in?next=${encodeURIComponent(selectionPath)}`);
        return;
      }
      const selection = `${chosen.courtId}:${chosen.startsAt}`;
      if (holdAttempt.current?.selection !== selection)
        holdAttempt.current = { selection, key: newIdempotencyKey() };
      const result = await academyPost<{ booking: AcademyBooking }>(
        "/api/bookings/holds",
        {
          courtId: chosen.courtId,
          startsAt: chosen.startsAt,
          idempotencyKey: holdAttempt.current.key,
        },
      );
      router.push(
        `/book/review?booking=${encodeURIComponent(result.booking.id)}`,
      );
    } catch (cause) {
      if (cause instanceof AcademyApiError && cause.status === 401)
        router.push(`/sign-in?next=${encodeURIComponent(selectionPath)}`);
      else {
        setNotice(
          cause instanceof Error ? cause.message : "Unable to hold this court.",
        );
        if (cause instanceof AcademyApiError && cause.status === 409) {
          holdAttempt.current = null;
          inventory.refresh();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <p className={styles.breadcrumb}>
        <Link href="/">Home</Link> / Book a court
      </p>
      <h1 className={`academy-heading ${styles.pageHeading}`}>
        Make time for a game<span className={styles.dot}>.</span>
      </h1>
      <p className={styles.intro}>
        Pick a day, a time and your court. Every reservation is one hour, for up
        to four players.
      </p>
      <div className={styles.bookingFilters}>
        <label className={styles.field}>
          Select date
          <select
            className="academy-input"
            value={date}
            onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              setNotice(null);
              updateRouteSelection(nextDate, hour, courtId);
            }}
            disabled={busy}
          >
            {dates.map((day) => (
              <option key={day} value={day}>
                {formatCourtDate(day, { weekday: "long" })}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Select time
          <select
            className="academy-input"
            value={hour}
            onChange={(event) => {
              const nextHour = event.target.value;
              setHour(nextHour);
              setNotice(null);
              updateRouteSelection(date, nextHour, courtId);
            }}
            disabled={busy}
          >
            {Array.from({ length: 18 }, (_, index) => index + 6).map((time) => (
              <option key={time} value={time}>
                {formatCourtTime(slotStart(date, time))}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.field}>
          Duration
          <div className={styles.duration}>
            <Hourglass size={18} />1 hour
          </div>
        </div>
      </div>
      {inventory.loading ? (
        <div className={styles.loading} role="status">
          Checking court availability…
        </div>
      ) : inventory.error ? (
        <div className={styles.empty}>
          <h2 className="academy-heading">Availability is unavailable.</h2>
          <p>{inventory.error}</p>
          <button
            className="academy-button-secondary"
            onClick={inventory.refresh}
          >
            Try again
          </button>
          <p>
            For help, call <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>.
          </p>
        </div>
      ) : !inventory.data?.courts.length ? (
        <div className={styles.empty}>
          <h2 className="academy-heading">No courts are available to book.</h2>
          <p>Please try another day or call the academy.</p>
        </div>
      ) : (
        <div className={styles.bookingLayout}>
          <div>
            <div
              className={styles.courtMap}
              role="group"
              aria-label="Choose a court for the selected time"
            >
              {inventory.data.courts
                .slice()
                .sort((a, b) => a.number - b.number)
                .map((court) => {
                  const slot = slots.find((item) => item.courtId === court.id);
                  const selected =
                    (selectedCourtId || chosen?.courtId) === court.id;
                  return (
                    <button
                      key={court.id}
                      disabled={!slot?.available || busy}
                      aria-pressed={selected}
                      aria-label={`${court.name}, ${!slot?.available ? "unavailable" : selected ? "selected" : "available"}`}
                      onClick={() => {
                        setCourtId(court.id);
                        updateRouteSelection(date, hour, court.id);
                      }}
                      className={`${styles.court} ${selected ? styles.selected : ""}`}
                    >
                      <span className={styles.courtLabel}>
                        {court.name}
                        <small>
                          {!slot?.available
                            ? "Unavailable"
                            : selected
                              ? "Selected"
                              : "Available"}
                        </small>
                      </span>
                    </button>
                  );
                })}
            </div>
            <div className={styles.legend} aria-hidden="true">
              <span>
                <i />
                Selected
              </span>
              <span>
                <i />
                Available
              </span>
              <span>
                <i />
                Unavailable
              </span>
            </div>
            <p className={styles.mapNote}>
              Court layout is a schematic. Availability updates when you select
              a date or refresh.
            </p>
            <button
              className="academy-button-secondary"
              onClick={inventory.refresh}
              disabled={busy}
            >
              Refresh availability
            </button>
          </div>
          <aside className={styles.review} aria-label="Your selection">
            <h2 className="academy-heading">
              {chosenCourt?.name ??
                (selectedSlot?.available === false
                  ? `${selectedCourtName ?? "Selected court"} is unavailable`
                  : "Choose another time")}
            </h2>
            <div className={styles.details}>
              <div>
                <CalendarDays size={20} />
                {formatCourtDate(date, { weekday: "long" })}
              </div>
              <div>
                <Clock3 size={20} />
                {chosen
                  ? `${formatCourtTime(chosen.startsAt)} – ${formatCourtTime(chosen.endsAt)}`
                  : selectedSlot?.available === false
                    ? "This court is unavailable at this time"
                    : "No court available at this time"}
              </div>
              <div>
                <LayoutGrid size={20} />1 hour · up to 4 players
              </div>
            </div>
            {chosen ? (
              <>
                <div className={styles.total}>
                  <span>Court booking</span>
                  <strong>{formatMoney(displayedPrice)}</strong>
                </div>
                {session.data?.paymentMode === "unconfigured" ? (
                  <a
                    className={`academy-button ${styles.fullButton}`}
                    href={ACADEMY.phoneHref}
                  >
                    Call to reserve
                  </a>
                ) : (
                  <button
                    className={`academy-button ${styles.fullButton}`}
                    disabled={busy || session.loading || Boolean(session.error)}
                    onClick={() => void holdCourt()}
                  >
                    {busy
                      ? "Holding your court…"
                      : session.loading
                        ? "Checking account…"
                        : session.data?.user
                          ? "Continue"
                          : "Sign in to continue"}
                  </button>
                )}
                <p className={styles.memberNote}>
                  Active members pay{" "}
                  {formatMoney(ACADEMY.memberCourtPricePaise)} per court-hour.
                </p>
                <p className={styles.small}>
                  {session.data?.paymentMode === "unconfigured" ? (
                    <>
                      Checking availability does not reserve this court. Online
                      checkout is unavailable; call the academy to arrange a
                      reservation. Tell us your selected court, date and time.
                      All times are India Standard Time.
                    </>
                  ) : (
                    <>
                      Continue creates a ten-minute hold while you complete
                      payment. The booking is confirmed after payment clears.
                      All times are India Standard Time.
                    </>
                  )}
                </p>
              </>
            ) : selectedSlot?.available === false ? (
              <p className={styles.intro}>
                This court is no longer available for that time. Choose another
                court or time; your selection will not be switched
                automatically.
              </p>
            ) : (
              <p className={styles.intro}>
                Try another time or day. Booked courts and maintenance periods
                cannot be selected.
              </p>
            )}
            {session.error && (
              <p role="alert" className={styles.error}>
                {session.error}{" "}
                <button
                  className="academy-button-secondary"
                  onClick={session.refresh}
                >
                  Retry account check
                </button>
              </p>
            )}
            {notice && (
              <p role="alert" className={styles.error}>
                {notice}
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
