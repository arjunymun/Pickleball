import Link from "next/link";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import styles from "@/components/customer/academy-customer.module.css";

export const metadata = { robots: { index: false } };
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <nav className={styles.accountNav} aria-label="Your account">
          <Link href="/app">Your account</Link>
          <Link href="/app/bookings">Your bookings</Link>
          <Link href="/membership">Membership</Link>
        </nav>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
