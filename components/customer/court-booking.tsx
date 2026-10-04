"use client";

import { useRef, useState } from "react";
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
  slotStart,
} from "@/lib/academy/time";
import { useCustomerData } from "./customer-data";
import styles from "./academy-customer.module.css";

export function CourtBooking({
  initialDate,
  initialHour,
  initialCourt,
}: {
  initialDate?: string;
  initialHour?: string;
  initialCourt?: string;
}) {
  const router = useRouter();
  const dates = bookingDates();
  const [date, setDate] = useState(
    initialDate && dates.includes(initialDate) ? initialDate : dates[0],
  );
  const [hour, setHour] = useState(
    initialHour &&
      /^\d{1,2}$/.test(initialHour) &&
      Number(initialHour) >= 6 &&
      Number(initialHour) < 24
      ? initialHour
      : "18",
  );
  const [courtId, setCourtId] = useState(initialCourt ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const holdAttempt = useRef<{ selection: string; key: string } | null>(null);
  const inventory = useCustomerData<AvailabilityPayload>(
    `/api/availability?date=${encodeURIComponent(date)}`,
  );
  const session = useCustomerData<AcademySession>("/api/session");
  const slots =
    inventory.data?.slots.filter(
      (slot) => hourInIndia(slot.startsAt) === Number(hour),
    ) ?? [];
  const chosen =
    slots.find((slot) => slot.courtId === courtId && slot.available) ??
    slots.find((slot) => slot.available);
  const chosenCourt = inventory.data?.courts.find(
    (court) => court.id === chosen?.courtId,
  );
  const selectionPath = `/book?${new URLSearchParams({ date, time: hour, ...(chosen ? { court: chosen.courtId } : {}) })}`;
  const displayedPrice = chosen?.pricePaise ?? ACADEMY.courtPricePaise;

  async function holdCourt() {
    if (!chosen || busy || inventory.loading) return;
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
              setDate(event.target.value);
              setNotice(null);
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
              setHour(event.target.value);
              setNotice(null);
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
                  const selected = chosen?.courtId === court.id;
                  return (
                    <button
                      key={court.id}
                      disabled={!slot?.available || busy}
                      aria-pressed={selected}
                      aria-label={`${court.name}, ${!slot?.available ? "unavailable" : selected ? "selected" : "available"}`}
                      onClick={() => setCourtId(court.id)}
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
              {chosenCourt?.name ?? "Choose another time"}
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
                <p className={styles.memberNote}>
                  Active members pay{" "}
                  {formatMoney(ACADEMY.memberCourtPricePaise)} per court-hour.
                </p>
                <p className={styles.small}>
                  We hold your court for ten minutes while you pay. All times
                  are India Standard Time.
                </p>
              </>
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
