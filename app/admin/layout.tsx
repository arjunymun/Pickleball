import Link from "next/link";
import { redirect } from "next/navigation";
import { getAcademySession } from "@/lib/academy/server";
import styles from "@/components/admin/operations.module.css";
import { StaffNavigation } from "@/components/admin/staff-navigation";
import { AcademyBrand } from "@/components/academy/brand";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let session;
  try { session = await getAcademySession(); }
  catch {
    return <main id="main-content" className={styles.access}><p className="academy-eyebrow">Staff access</p><h1>Unable to verify access.</h1><p>The academy service is unavailable. Staff tools stay locked until your account can be verified.</p><Link className="academy-button-secondary" href="/admin">Try again</Link><Link href="/">Back to the academy</Link></main>;
  }
  if (!session.configured) return <main id="main-content" className={styles.access}><p className="academy-eyebrow">Staff access</p><h1>Staff tools need setup.</h1><p>The academy backend is not connected. An owner must complete the service setup before staff can manage bookings.</p><Link href="/">Back to the academy</Link></main>;
  if (!session.user) redirect("/sign-in?next=%2Fadmin");
  if (session.user.role !== "owner" && session.user.role !== "staff") return <main id="main-content" className={styles.access}><p className="academy-eyebrow">Staff access</p><h1>This account is a player account.</h1><p>Staff tools require an owner or staff account. Contact the academy owner if you work here.</p><Link className="academy-button" href="/app">Go to your account</Link></main>;
  return <div className={styles.shell}>
    <header className={styles.staffHeader}><div className={styles.brand}><AcademyBrand /><span className={styles.frontDesk}>Front desk</span></div><div className={styles.staffIdentity}><span>{session.user.name}<small>{session.user.role}</small></span><Link href="/app">Account</Link></div></header>
    <StaffNavigation />
    <main id="main-content" className={styles.main}>{session.paymentMode !== "live" && <p className={styles.environment}>{session.paymentMode === "test" ? "Payment test mode — gateway charges use test transactions." : "Online payments are not configured. Manual reservations remain clearly labelled."}</p>}{children}</main>
  </div>;
}
