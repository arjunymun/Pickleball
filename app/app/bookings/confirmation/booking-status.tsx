"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import type { CustomerAccountPayload } from "@/lib/academy/contracts";
import { formatMoney, ACADEMY } from "@/lib/academy/config";
import { formatCourtDate, formatCourtTime } from "@/lib/academy/time";
import { useCustomerData } from "@/components/customer/customer-data";
import styles from "@/components/customer/academy-customer.module.css";

export function BookingStatus({ bookingId }: { bookingId: string | null }) {
  const { data, error, loading, refresh } =
    useCustomerData<CustomerAccountPayload>("/api/bookings/me");
  const [checksEnded, setChecksEnded] = useState(false);
  const booking = data?.bookings.find((item) => item.id === bookingId);
  const waiting =
    booking?.status === "held" && booking.paymentStatus === "pending";
  useEffect(() => {
    if (!waiting) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      refresh();
      if (count >= 12) {
        clearInterval(interval);
        setChecksEnded(true);
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [waiting, refresh]);
  if (!bookingId)
    return (
      <div className={styles.page}>
        <h1 className={`academy-heading ${styles.pageHeading}`}>
          Find your booking.
        </h1>
        <Link href="/app/bookings" className="academy-button">
          Your bookings
        </Link>
      </div>
    );
  if (loading && !data)
    return (
      <div className={styles.page}>
        <div role="status" className={styles.loading}>
          Checking your booking…
        </div>
      </div>
    );
  if (error || !booking)
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h1 className="academy-heading">
            We couldn&apos;t find your booking.
          </h1>
          <p>{error ?? "This booking is not available in your account."}</p>
          <div className={styles.actionRow}>
            <button className="academy-button-secondary" onClick={refresh}>
              Check again
            </button>
            <Link
              className="academy-button-secondary"
              href={`/sign-in?next=${encodeURIComponent(`/app/bookings/confirmation?booking=${bookingId}`)}`}
            >
              Sign in
            </Link>
            <Link href="/app/bookings" className="academy-button">
              Your bookings
            </Link>
          </div>
        </div>
      </div>
    );
  const confirmed = ["confirmed", "checked_in", "completed"].includes(
    booking.status,
  );
  return (
    <div className={styles.page}>
      <section className={styles.confirmation}>
        {confirmed ? (
          <CheckCircle2 size={42} className={styles.confirmationIcon} />
        ) : (
          <Clock3 size={42} className={styles.confirmationIcon} />
        )}
        <h1 className="academy-heading">
          {confirmed
            ? "See you on court."
            : waiting
              ? "Checking your payment."
              : `Booking ${booking.status.replaceAll("_", " ")}.`}
        </h1>
        <p className={styles.intro}>
          {confirmed
            ? "Your reservation is confirmed. Keep this booking reference handy when you arrive."
            : waiting
              ? "Your booking will be confirmed after payment is verified. Check its status before making another payment."
              : "The latest status of your reservation is shown below."}
        </p>
        {data?.paymentMode === "test" && booking.source === "online" && (
          <p className={styles.notice}>
            Test payment booking. No real charge was collected.
          </p>
        )}
        <div className={styles.review}>
          <dl className={styles.statusDetails}>
            <div>
              <dt>Court</dt>
              <dd>{booking.courtName}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatCourtDate(booking.startsAt, { weekday: "long" })}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {formatCourtTime(booking.startsAt)} –{" "}
                {formatCourtTime(booking.endsAt)} IST
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {formatMoney(booking.amountPaise)} ·{" "}
                {booking.paymentStatus.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt>Booking reference</dt>
              <dd className={styles.small}>{booking.id}</dd>
            </div>
            {booking.refundedPaise > 0 && (
              <div>
                <dt>Refund</dt>
                <dd>{formatMoney(booking.refundedPaise)}</dd>
              </div>
            )}
          </dl>
        </div>
        {waiting && checksEnded && (
          <p className={styles.notice}>
            Confirmation is taking longer than expected. Refresh the status or
            call the academy; do not pay again until this is resolved.
          </p>
        )}
        <div className={styles.actionRow} style={{ marginTop: 22 }}>
          <Link href="/app/bookings" className="academy-button">
            Your bookings
          </Link>
          <button
            className="academy-button-secondary"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Checking…" : "Refresh status"}
          </button>
        </div>
        <p className={styles.small}>
          Need to cancel or have a payment question?{" "}
          <a href={ACADEMY.phoneHref}>Call {ACADEMY.phone}</a>.
        </p>
      </section>
    </div>
  );
}
