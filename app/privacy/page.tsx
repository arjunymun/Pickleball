import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { ACADEMY } from "@/lib/academy/config";
import styles from "@/components/customer/academy-customer.module.css";

export const metadata = { title: "Privacy notice" };
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <article className={styles.document}>
          <h1 className="academy-heading">Your information</h1>
          <p>
            This notice explains the information used by the {ACADEMY.name}{" "}
            website to run accounts, bookings and memberships.
          </p>
          <h2 className="academy-heading">Account &amp; booking information</h2>
          <p>
            Signing in with Google or an email link creates a player account.
            The website uses your name, email address and account identifier.
            Where you provide a phone number to the academy, staff may record it
            for booking support.
          </p>
          <p>
            We keep reservation times, courts, booking status, payment
            references, amounts and refund records. For membership, we record
            subscription status, the paid period and daily attendance. Staff may
            keep notes needed to handle booking questions and academy visits.
          </p>
          <h2 className="academy-heading">Payments &amp; service providers</h2>
          <p>
            Supabase supports sign-in and stores account and academy records.
            Razorpay handles online payments and recurring membership billing.
            Payment details entered in Razorpay checkout are processed by
            Razorpay; the academy website stores payment references and
            statuses.
          </p>
          <p>
            Google sign-in shares the identity information needed to create your
            account. It does not give the academy access to your Gmail messages.
          </p>
          <h2 className="academy-heading">Access &amp; cookies</h2>
          <p>
            Sign-in cookies maintain your session. Authorized academy staff can
            access the customer information needed to run court bookings,
            payments and membership visits. Your booking history is available
            through your own account.
          </p>
          <h2 className="academy-heading">Questions &amp; corrections</h2>
          <p>
            To ask about your information, correct a record or request account
            deletion, call <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>.
            Staff may need to verify your identity. Payment and booking records
            may need to be retained to resolve transactions and meet applicable
            recordkeeping requirements.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
