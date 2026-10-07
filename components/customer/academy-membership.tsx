"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CalendarDays, LayoutGrid } from "lucide-react";
import type {
  AcademyMembership,
  AcademySession,
  MembershipCheckoutPayload,
} from "@/lib/academy/contracts";
import { academyPost, newIdempotencyKey } from "@/lib/academy/client";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import { formatCourtDate } from "@/lib/academy/time";
import { useCustomerData } from "./customer-data";
import { openPaymentCheckout } from "./payment-checkout";
import styles from "./academy-customer.module.css";

export function AcademyMembershipPage() {
  const router = useRouter();
  const session = useCustomerData<AcademySession>("/api/session");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [renewalConsent, setRenewalConsent] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const checkoutKey = useRef<string | null>(null);
  const membership = session.data?.membership;
  const active = membership?.status === "active";
  async function join() {
    if (busy || !renewalConsent) return;
    if (!session.data?.user) {
      router.push("/sign-in?next=%2Fmembership");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      checkoutKey.current ??= newIdempotencyKey();
      const checkout = await academyPost<MembershipCheckoutPayload>(
        "/api/memberships/checkout",
        { idempotencyKey: checkoutKey.current },
      );
      await openPaymentCheckout({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        currency: checkout.currency,
        name: ACADEMY.name,
        description: "Monthly academy membership",
        prefill: {
          name: session.data.user.name,
          email: session.data.user.email,
        },
      });
      router.push("/app?membership=pending");
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Membership checkout could not start.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancelRenewal() {
    setBusy(true);
    setNotice(null);
    try {
      await academyPost<{ membership: AcademyMembership }>(
        "/api/memberships/cancel",
        {},
      );
      setNotice(
        "Automatic renewal is cancelled. Your paid membership continues until the end of the current period.",
      );
      setConfirmCancel(false);
      session.refresh();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "We couldn't cancel renewal. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.page}>
      <p className={styles.breadcrumb}>
        <Link href="/">Home</Link> / Membership
      </p>
      <div className={styles.membershipLayout}>
        <section>
          <h1 className={`academy-heading ${styles.pageHeading}`}>
            Make it your daily game.
          </h1>
          <p className={styles.intro}>
            A little court time, every day. Join the academy and build your
            rhythm.
          </p>
          <p className={`${styles.membershipPrice} ${styles.mobilePrice}`}>
            {formatMoney(ACADEMY.membershipPricePaise)}
            <span> / month · renews monthly</span>
          </p>
          <ul className={styles.benefits}>
            <li>
              <CalendarDays size={23} />
              <span>
                One hour of individual play each day, recorded by staff when you
                visit. Hours do not carry over.
              </span>
            </li>
            <li>
              <LayoutGrid size={23} />
              <span>
                Book a whole court for{" "}
                {formatMoney(ACADEMY.memberCourtPricePaise)} per hour while your
                paid membership is active.
              </span>
            </li>
            <li>
              <Check size={23} />
              <span>
                Cancel automatic renewal anytime. Your membership continues
                through the paid period.
              </span>
            </li>
          </ul>
          <p className={styles.small}>
            Your daily individual-play hour is used in person. It does not
            include a free private court reservation. Individual play is subject
            to court space; call ahead to arrange your visit.
          </p>
          <div className={styles.membershipPhoto}>
            <Image
              src={ACADEMY.photos.daylight}
              quality={90}
              alt="Blue and green outdoor pickleball courts at the academy in daylight"
              fill
              sizes="(max-width:700px) 100vw, 600px"
            />
          </div>
        </section>
        <aside className={styles.review}>
          <h2 className="academy-heading">Academy membership</h2>
          <p className={styles.membershipPrice}>
            {formatMoney(ACADEMY.membershipPricePaise)}
            <span> / month</span>
          </p>
          <p className={styles.intro}>
            Automatically renews every month until you cancel.
          </p>
          {session.loading && !session.data ? (
            <p role="status" className={styles.notice}>
              Checking membership…
            </p>
          ) : session.error ? (
            <div className={styles.error} role="alert">
              <p>{session.error}</p>
              <button
                className="academy-button-secondary"
                onClick={session.refresh}
              >
                Try again
              </button>
            </div>
          ) : active ? (
            <>
              <span className={styles.badge}>Active member</span>
              {membership.paidThrough && (
                <p className={styles.small}>
                  {membership.cancelAtPeriodEnd
                    ? "Membership ends"
                    : "Paid through"}{" "}
                  {formatCourtDate(membership.paidThrough, { year: "numeric" })}
                  .
                </p>
              )}
              {membership.cancelAtPeriodEnd ? (
                <p className={styles.notice}>
                  Automatic renewal is cancelled. You can continue using your
                  benefits until the paid period ends.
                </p>
              ) : confirmCancel ? (
                <div className={styles.notice}>
                  <p>
                    Stop the next monthly payment? Your current paid benefits
                    will continue.
                  </p>
                  <div className={styles.actionRow}>
                    <button
                      className="academy-button-secondary"
                      onClick={() => void cancelRenewal()}
                      disabled={busy}
                    >
                      {busy ? "Cancelling…" : "Cancel automatic renewal"}
                    </button>
                    <button
                      className="academy-button-secondary"
                      onClick={() => setConfirmCancel(false)}
                      disabled={busy}
                    >
                      Keep renewal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="academy-button-secondary"
                  onClick={() => setConfirmCancel(true)}
                >
                  Manage automatic renewal
                </button>
              )}
              <Link
                href="/book"
                className="academy-button"
                style={{ marginTop: 18 }}
              >
                Book at your member rate
              </Link>
            </>
          ) : membership?.status === "pending" ? (
            <>
              {session.data?.paymentMode === "unconfigured" && (
                <p className={styles.notice}>
                  Monthly membership checkout is unavailable. Call the academy
                  to ask about current membership options.
                </p>
              )}
              <p className={styles.notice}>
                Membership payment confirmation is pending. Your benefits start
                after the first payment is verified. Check your account before
                subscribing again.
              </p>
              <Link href="/app" className="academy-button">
                Check your account
              </Link>
              <p className={styles.small}>
                If you closed checkout before paying, continue the same
                subscription below. If you already paid, check your account
                first.
              </p>
              <label
                className={styles.small}
                style={{ display: "flex", gap: 10, margin: "18px 0" }}
              >
                <input
                  type="checkbox"
                  checked={renewalConsent}
                  onChange={(event) => setRenewalConsent(event.target.checked)}
                  disabled={busy}
                />
                <span>
                  I agree to {formatMoney(ACADEMY.membershipPricePaise)}{" "}
                  automatic monthly renewal and the{" "}
                  <Link href="/terms">membership terms</Link>.
                </span>
              </label>
              <button
                className={`academy-button-secondary ${styles.fullButton}`}
                onClick={() => void join()}
                disabled={
                  busy ||
                  !renewalConsent ||
                  session.data?.paymentMode === "unconfigured"
                }
              >
                {busy ? "Opening checkout…" : "Continue membership checkout"}
              </button>
            </>
          ) : (
            <>
              {membership?.status === "past_due" && (
                <p className={styles.notice}>
                  Your renewal payment needs attention. Call the academy to
                  restore your membership; member pricing is unavailable while
                  payment is overdue.
                </p>
              )}
              {session.data?.paymentMode === "test" && (
                <p className={styles.notice}>
                  Test subscription checkout. No real monthly payment is
                  collected.
                </p>
              )}
              {session.data?.paymentMode === "unconfigured" && (
                <p className={styles.notice}>
                  Monthly membership checkout is unavailable. Call the academy
                  to ask about current membership options.
                </p>
              )}
              <label
                className={styles.small}
                style={{ display: "flex", gap: 10, marginBottom: 18 }}
              >
                <input
                  type="checkbox"
                  checked={renewalConsent}
                  onChange={(event) => setRenewalConsent(event.target.checked)}
                  disabled={busy || !session.data?.configured}
                />
                <span>
                  I agree to {formatMoney(ACADEMY.membershipPricePaise)}{" "}
                  automatic monthly renewal and the{" "}
                  <Link href="/terms">membership terms</Link>.
                </span>
              </label>
              <button
                className={`academy-button ${styles.fullButton}`}
                onClick={() => void join()}
                disabled={
                  busy ||
                  !renewalConsent ||
                  !session.data?.configured ||
                  session.data.paymentMode === "unconfigured" ||
                  membership?.status === "past_due"
                }
              >
                {busy
                  ? "Opening checkout…"
                  : !session.data?.configured ||
                      session.data.paymentMode === "unconfigured"
                    ? "Membership checkout unavailable"
                    : session.data.user
                      ? "Start monthly membership"
                      : "Sign in to join"}
              </button>
            </>
          )}
          {notice && (
            <p role="status" className={styles.notice}>
              {notice}
            </p>
          )}
          <p className={styles.small}>
            Questions? Call <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>.
            Read our <Link href="/terms">terms</Link> and{" "}
            <Link href="/privacy">privacy notice</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}
