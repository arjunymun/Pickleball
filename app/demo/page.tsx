import Link from "next/link";
import { ArrowUpRight, Database, LockKeyhole, CalendarCheck } from "lucide-react";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { AcademyWalkthrough } from "@/components/demo/academy-walkthrough";
import styles from "@/components/demo/walkthrough.module.css";

export const metadata = {
  title: "Project walkthrough",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return (
    <><SiteHeader /><main id="main-content" className={`academy-container ${styles.page}`}>
      <p className="academy-eyebrow">Behind the product</p><h1 className={`academy-heading ${styles.heading}`}>A club website with a real operating model.</h1>
      <p className={styles.lead}>The public website serves players. This separate walkthrough explains the engineering choices behind booking, payments, and the front desk, with an isolated example you can explore.</p>
      <div className={styles.links}><Link href="/" className="academy-button-secondary">Back to the academy</Link><a href="https://github.com/arjunymun/Pickleball" target="_blank" rel="noopener noreferrer" className="academy-button-secondary">Explore the source <ArrowUpRight size={18} /></a></div>
      <AcademyWalkthrough />
      <section className={styles.architecture} aria-label="Architecture">
        <article className="academy-card"><CalendarCheck size={26} /><h3 className="academy-heading">One court inventory</h3><p>Customers, staff, maintenance, and manually entered platform bookings share the same reservation boundary. A ten-minute hold protects a checkout in progress.</p></article>
        <article className="academy-card"><LockKeyhole size={26} /><h3 className="academy-heading">Payment is evidence</h3><p>Booking confirmation belongs to the server after provider verification. Ownership, amount, currency, and retries are checked separately from the checkout interface.</p></article>
        <article className="academy-card"><Database size={26} /><h3 className="academy-heading">Paid membership periods</h3><p>Monthly membership unlocks one individual hour each day and a court-hire discount. Attendance is a daily record, rather than a wallet of invented credits.</p></article>
      </section>
      <p className={styles.tech}>Built with Next.js, React, TypeScript, Supabase/PostgreSQL, and Razorpay. The example above demonstrates the intended journey using local sample state; it is not evidence that a live gateway or deployment has been verified.</p>
    </main><SiteFooter /></>
  );
}
