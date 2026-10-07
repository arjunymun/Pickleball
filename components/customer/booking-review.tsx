"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Hourglass,
  LayoutGrid,
  LockKeyhole,
} from "lucide-react";
import type {
  AcademyBooking,
  CourtCheckoutPayload,
  CustomerAccountPayload,
} from "@/lib/academy/contracts";
import { academyPost, newIdempotencyKey } from "@/lib/academy/client";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import { formatCourtDate, formatCourtTime } from "@/lib/academy/time";
import { useCustomerData } from "./customer-data";
import { openPaymentCheckout } from "./payment-checkout";
import styles from "./academy-customer.module.css";

export function BookingReview({ bookingId }: { bookingId: string | null }) {
  const router = useRouter();
  const account = useCustomerData<CustomerAccountPayload>("/api/bookings/me");
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const checkoutKey = useRef<string | null>(null);
  const booking = account.data?.bookings.find((item) => item.id === bookingId);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);
  const remaining =
    booking?.holdExpiresAt && now
      ? Math.max(
          0,
          Math.ceil((new Date(booking.holdExpiresAt).getTime() - now) / 1_000),
        )
      : null;
  const held = booking?.status === "held" && remaining !== 0;
  const confirmationPath = `/app/bookings/confirmation?booking=${encodeURIComponent(bookingId ?? "")}`;

  async function pay() {
    if (!booking || !held || busy || !account.data) return;
    setBusy(true);
    setNotice(null);
    try {
      checkoutKey.current ??= newIdempotencyKey();
      const checkout = await academyPost<CourtCheckoutPayload>(
        `/api/bookings/${encodeURIComponent(booking.id)}/checkout`,
        { idempotencyKey: checkoutKey.current },
      );
      const result = await openPaymentCheckout({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: ACADEMY.name,
        description: `${booking.courtName} · one-hour court booking`,
        prefill: {
          name: account.data.user.name,
          email: account.data.user.email,
        },
      });
      setVerificationPending(true);
      try {
        const verified = await academyPost<{ booking: AcademyBooking }>(
          "/api/payments/verify",
          {
            bookingId: booking.id,
            razorpay_order_id: result.razorpay_order_id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature,
          },
        );
        if (verified.booking.status === "confirmed")
          router.push(confirmationPath);
        else {
          setNotice(
            "Your payment is being checked. View your booking for the latest status; do not pay again.",
          );
          account.refresh();
        }
      } catch (cause) {
        setNotice(
          `${cause instanceof Error ? cause.message : "We couldn't check the payment yet."} View your booking status before trying another payment.`,
        );
      }
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Payment could not start. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!bookingId)
    return (
      <div className={styles.page}>
        <h1 className={`academy-heading ${styles.pageHeading}`}>
          Choose your court first.
        </h1>
        <Link href="/book" className="academy-button">
          Find a court
        </Link>
      </div>
    );
  if (account.loading)
    return (
      <div className={styles.page}>
        <div role="status" className={styles.loading}>
          Loading your reservation…
        </div>
      </div>
    );
  if (account.error)
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h1 className="academy-heading">
            We couldn&apos;t load your reservation.
          </h1>
          <p>{account.error}</p>
          <div className={styles.actionRow}>
            <button
              className="academy-button-secondary"
              onClick={account.refresh}
            >
              Try again
            </button>
            <Link
              className="academy-button"
              href={`/sign-in?next=${encodeURIComponent(`/book/review?booking=${bookingId}`)}`}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  if (!booking)
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h1 className="academy-heading">Reservation not found.</h1>
          <p>This reservation is not available in your account.</p>
          <Link href="/app/bookings" className="academy-button">
            Your bookings
          </Link>
        </div>
      </div>
    );
  return (
    <div className={styles.page}>
      <p className={styles.breadcrumb}>
        <Link href="/book">Book a court</Link> / Review your booking
      </p>
      <div className={styles.reviewLayout}>
        <aside className={styles.reviewAside}>
          <h2 className={`academy-heading ${styles.sectionHeading}`}>
            Almost game time.
          </h2>
          <p className={styles.intro}>
            {account.data?.paymentMode === "unconfigured"
              ? "This is a temporary hold, not a confirmed booking. Online checkout is unavailable."
              : "Your court is held temporarily while you finish checkout. Payment must clear to confirm the booking."}
          </p>
          <p className={styles.small}>
            Need to cancel after booking? Call the academy. Our team handles
            cancellations and any applicable refund.
          </p>
          <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>
        </aside>
        <section className={styles.review}>
          <h1 className={`academy-heading ${styles.sectionHeading}`}>
            Review your booking
          </h1>
          <div className={styles.reviewPhoto}>
            <Image
              src={ACADEMY.photos.reverse}
              quality={90}
              alt="The academy's blue pickleball courts viewed from the opposite end in daylight"
              fill
              sizes="(max-width: 700px) 100vw, 420px"
            />
          </div>
          <h2
            className="academy-heading"
            style={{ fontSize: 26, marginBottom: 8 }}
          >
            {ACADEMY.name}
          </h2>
          <p className={styles.small}>{ACADEMY.location}</p>
          {held && (
            <div className={styles.holdTimer} role="status">
              <Hourglass size={18} />
              {remaining === null
                ? "Checking your ten-minute hold…"
                : `Court held for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
            </div>
          )}
          <div className={styles.details}>
            <div>
              <LayoutGrid size={20} />
              {booking.courtName}
            </div>
            <div>
              <CalendarDays size={20} />
              {formatCourtDate(booking.startsAt, { weekday: "long" })}
            </div>
            <div>
              <Clock3 size={20} />
              {formatCourtTime(booking.startsAt)} –{" "}
              {formatCourtTime(booking.endsAt)} · IST
            </div>
            <div>
              <Hourglass size={20} />1 hour · up to 4 players
            </div>
          </div>
          <div className={styles.total}>
            <span>Total</span>
            <strong>{formatMoney(booking.amountPaise)}</strong>
          </div>
          {account.data?.paymentMode === "test" && (
            <p className={styles.notice}>
              Test checkout. This booking uses test payments; no real charge is
              collected.
            </p>
          )}
          {held &&
          !verificationPending &&
          account.data?.paymentMode === "unconfigured" ? (
            <>
              <p className={styles.notice}>
                Your court is held for ten minutes, but it is not booked yet.
                Call the academy to arrange payment and have staff confirm your
                reservation before the hold expires.
              </p>
              <a
                className={`academy-button ${styles.fullButton}`}
                href={ACADEMY.phoneHref}
              >
                Call {ACADEMY.phone} to confirm
              </a>
            </>
          ) : held && !verificationPending ? (
            <>
              <p className={styles.small}>
                <LockKeyhole size={14} /> Pay securely with Razorpay. Available
                methods appear at checkout.
              </p>
              <p className={styles.small}>
                By paying, you agree to the{" "}
                <Link href="/terms">booking terms</Link>.
              </p>
              <button
                className={`academy-button ${styles.fullButton}`}
                disabled={
                  busy ||
                  remaining === null ||
                  account.data?.paymentMode === "unconfigured"
                }
                onClick={() => void pay()}
              >
                {busy
                  ? "Opening checkout…"
                  : account.data?.paymentMode === "unconfigured"
                    ? "Payments currently unavailable"
                    : `Pay ${formatMoney(booking.amountPaise)}`}
              </button>
            </>
          ) : (
            <>
              <p className={styles.notice}>
                {verificationPending
                  ? "Payment confirmation is pending. Check your booking before paying again."
                  : ["confirmed", "checked_in", "completed"].includes(
                        booking.status,
                      )
                    ? "Your court booking is confirmed."
                    : "This hold is no longer available. Check the booking status or choose a new court."}
              </p>
              <Link
                href={confirmationPath}
                className={`academy-button ${styles.fullButton}`}
              >
                View booking status
              </Link>
              {!verificationPending &&
                !["confirmed", "checked_in", "completed"].includes(
                  booking.status,
                ) && (
                  <Link href="/book" className="academy-button-secondary">
                    Choose another court
                  </Link>
                )}
            </>
          )}
          {notice && (
            <p role="alert" className={styles.error}>
              {notice}
            </p>
          )}
          <p className={styles.small}>
            Cancellation: <a href={ACADEMY.phoneHref}>call the academy</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
