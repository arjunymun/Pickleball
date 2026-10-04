import Link from "next/link";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import styles from "@/components/customer/academy-customer.module.css";

export const metadata = { title: "Booking & membership terms" };
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <article className={styles.document}>
          <h1 className="academy-heading">Booking &amp; membership terms</h1>
          <p>
            These are the rules for booking and playing at {ACADEMY.name},{" "}
            {ACADEMY.location}. For help or a question about a reservation,{" "}
            <a href={ACADEMY.phoneHref}>call {ACADEMY.phone}</a>.
          </p>
          <h2 className="academy-heading">Court bookings</h2>
          <ul>
            <li>
              One reservation covers a whole court for one hour, for up to four
              players.
            </li>
            <li>
              The standard rate is {formatMoney(ACADEMY.courtPricePaise)} per
              court-hour. Active, paid members pay{" "}
              {formatMoney(ACADEMY.memberCourtPricePaise)} per court-hour.
            </li>
            <li>
              Courts operate from 6 AM to midnight. Booking dates and times use
              India Standard Time.
            </li>
            <li>
              You can book within a rolling {ACADEMY.bookingWindowDays}-day
              window. A selected court is held for {ACADEMY.holdMinutes} minutes
              while you complete payment.
            </li>
            <li>
              A booking is confirmed only after payment is verified. A checkout
              return or bank debit by itself does not confirm the court. Check
              your account before making another payment.
            </li>
          </ul>
          <h2 className="academy-heading">Cancellations &amp; refunds</h2>
          <p>
            To cancel a court booking, call the academy with your booking
            reference. Staff records the reason and confirms whether a full,
            partial or no refund applies. Online self-service cancellation is
            not available.
          </p>
          <p>
            If a payment has been taken but your booking is not confirmed, call
            the academy before paying again. Your account shows the latest
            booking and refund status.
          </p>
          <h2 className="academy-heading">Individual play</h2>
          <p>
            Individual play costs {formatMoney(ACADEMY.individualPricePaise)}{" "}
            per person per hour and is arranged and paid for in person. Call
            ahead to check space. This is separate from a private court
            reservation.
          </p>
          <h2 className="academy-heading">Monthly membership</h2>
          <ul>
            <li>
              Membership costs {formatMoney(ACADEMY.membershipPricePaise)} and
              automatically renews each month until cancelled.
            </li>
            <li>
              Your benefits begin after the first membership payment is verified
              and continue for the paid period.
            </li>
            <li>
              Membership includes one hour of individual play each day, recorded
              by staff at the academy and subject to court space. Unused daily
              hours do not roll over.
            </li>
            <li>
              The daily individual-play benefit does not include a free private
              court booking. Private courts are charged at the active member
              rate.
            </li>
            <li>
              Cancel automatic renewal from the{" "}
              <Link href="/membership">membership page</Link>. This stops the
              next renewal; your paid benefits continue until the current period
              ends.
            </li>
            <li>
              If a renewal payment fails, benefits and member pricing are
              unavailable until an active paid period is restored. Contact the
              academy for help.
            </li>
          </ul>
          <h2 className="academy-heading">Test checkout</h2>
          <p>
            When the website displays a test-payment notice, checkout uses test
            payments and does not collect real money. Test bookings are stored
            in your account and are identified as test bookings. Confirm actual
            playing arrangements with the academy.
          </p>
          <h2 className="academy-heading">Your account</h2>
          <p>
            Use your own Google account or email address to sign in. Keep your
            sign-in links private. Please provide accurate information and
            follow staff instructions while at the academy.
          </p>
          <p>
            Read the <Link href="/privacy">privacy notice</Link> for how account
            and booking information is used.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
