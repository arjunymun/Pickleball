"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Check } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import type { CustomerAccountPayload } from "@/lib/academy/contracts";
import { formatCourtDate, formatCourtTime } from "@/lib/academy/time";
import { useCustomerData } from "./customer-data";
import styles from "./academy-customer.module.css";

export function CustomerAccount({
  bookingsOnly = false,
}: {
  bookingsOnly?: boolean;
}) {
  const pathname = usePathname();
  const { data, loading, error, refresh } =
    useCustomerData<CustomerAccountPayload>("/api/bookings/me");
  const pendingMembership = data?.membership?.status === "pending";
  useEffect(() => {
    if (!pendingMembership) return;
    let checks = 0;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        checks++;
        refresh();
      }
      if (checks >= 12) clearInterval(timer);
    }, 5_000);
    return () => clearInterval(timer);
  }, [pendingMembership, refresh]);
  if (loading && !data)
    return (
      <div className={styles.page}>
        <div className={styles.loading} role="status">
          Loading your account…
        </div>
      </div>
    );
  if (error || !data)
    return (
      <div className={styles.page}>
        <h1 className={`academy-heading ${styles.pageHeading}`}>
          Your account
        </h1>
        <div className={styles.empty}>
          <p>{error ?? "Sign in to see your bookings and membership."}</p>
          <div className={styles.actionRow}>
            <Link
              href={`/sign-in?next=${encodeURIComponent(pathname)}`}
              className="academy-button"
            >
              Sign in
            </Link>
            <button className="academy-button-secondary" onClick={refresh}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  const bookings = data.bookings
    .slice()
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return (
    <div className={styles.page}>
      <div className={styles.accountTop}>
        <div>
          <h1 className={`academy-heading ${styles.pageHeading}`}>
            {bookingsOnly
              ? "Your bookings."
              : `Good to see you, ${data.user.name.split(" ")[0] || "player"}.`}
          </h1>
          <p className={styles.intro}>
            {bookingsOnly
              ? "Court time, payment status and booking details, together."
              : "Your court time and membership, in one place."}
          </p>
        </div>
        <div className={styles.actionRow}>
          <Link href="/book" className="academy-button">
            Book a court
          </Link>
          <SignOutButton label={data.user.email} />
        </div>
      </div>
      {data.paymentMode === "test" && (
        <p className={styles.notice}>
          Online checkout uses test payments. Reservations are saved to your
          account; test checkout collects no real money.
        </p>
      )}
      <div className={bookingsOnly ? undefined : styles.accountGrid}>
        <section>
          <h2 className={`academy-heading ${styles.sectionHeading}`}>
            {bookingsOnly ? "Reservations" : "Your court time"}
          </h2>
          {bookings.length ? (
            <div className={styles.bookingList}>
              {bookings.map((booking) => (
                <article key={booking.id} className={styles.bookingItem}>
                  <div>
                    <h3>{booking.courtName}</h3>
                    <p>
                      {formatCourtDate(booking.startsAt, { weekday: "long" })} ·{" "}
                      {formatCourtTime(booking.startsAt)} –{" "}
                      {formatCourtTime(booking.endsAt)}
                    </p>
                    <p>
                      {formatMoney(booking.amountPaise)} · payment{" "}
                      {booking.paymentStatus.replaceAll("_", " ")}
                    </p>
                    <span className={styles.badge}>
                      {booking.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <Link
                    href={
                      booking.status === "held"
                        ? `/book/review?booking=${encodeURIComponent(booking.id)}`
                        : `/app/bookings/confirmation?booking=${encodeURIComponent(booking.id)}`
                    }
                  >
                    {booking.status === "held"
                      ? "Continue to payment"
                      : "View booking"}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <CalendarDays size={27} />
              <h3>No bookings yet.</h3>
              <p>Find an hour that works for you and get out on court.</p>
              <Link href="/book" className="academy-button">
                Choose your court
              </Link>
            </div>
          )}
          <p className={styles.small}>
            To cancel a booking or ask about a refund, call{" "}
            <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>. Staff records the
            cancellation and any refund.
          </p>
        </section>
        {!bookingsOnly && (
          <aside className={styles.review}>
            <h2 className="academy-heading">Your membership</h2>
            {data.membership ? (
              <>
                <span className={styles.badge}>
                  {data.membership.status.replaceAll("_", " ")}
                </span>
                {data.membership.status === "active" && (
                  <>
                    <p>
                      <Check size={16} /> One individual hour each day.
                    </p>
                    <p className={styles.small}>
                      Member court rate:{" "}
                      {formatMoney(ACADEMY.memberCourtPricePaise)} per hour.
                      Staff records your daily visit at the academy.
                    </p>
                  </>
                )}
                {data.membership.paidThrough && (
                  <p className={styles.small}>
                    {data.membership.cancelAtPeriodEnd
                      ? "Access ends"
                      : "Paid through"}{" "}
                    {formatCourtDate(data.membership.paidThrough, {
                      year: "numeric",
                    })}
                    .
                  </p>
                )}
                {pendingMembership && (
                  <p className={styles.notice}>
                    Membership payment confirmation is pending. Benefits become
                    available after your first payment is verified.
                  </p>
                )}
                <Link href="/membership" className="academy-button-secondary">
                  Manage membership
                </Link>
              </>
            ) : (
              <>
                <p className={styles.intro}>
                  Make a daily game part of your routine.
                </p>
                <p className={styles.membershipPrice}>
                  {formatMoney(ACADEMY.membershipPricePaise)}
                  <span> / month</span>
                </p>
                <p className={styles.small}>
                  Automatically renews monthly. Includes one individual-play
                  hour a day, plus {formatMoney(ACADEMY.memberCourtPricePaise)}{" "}
                  court bookings.
                </p>
                <Link href="/membership" className="academy-button">
                  Explore membership
                </Link>
              </>
            )}
            {data.attendance.length > 0 && (
              <>
                <h3>Recent member visits</h3>
                <ul className={styles.small}>
                  {data.attendance
                    .slice(-5)
                    .reverse()
                    .map((visit) => (
                      <li key={visit.id}>{formatCourtDate(visit.date)}</li>
                    ))}
                </ul>
              </>
            )}
          </aside>
        )}
      </div>
      <button
        className="academy-button-secondary"
        onClick={refresh}
        disabled={loading}
      >
        {loading ? "Refreshing…" : "Refresh account"}
      </button>
    </div>
  );
}
