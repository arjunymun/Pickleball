"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./operations.module.css";
const links = [{ href: "/admin", label: "Court schedule" }, { href: "/admin/customers", label: "Players & attendance" }, { href: "/admin/payments", label: "Payment follow-ups" }, { href: "/admin/settings", label: "Club rules" }];
export function StaffNavigation() {
  const pathname = usePathname();
  return <nav className={styles.navigation} aria-label="Staff navigation">{links.map((link) => {
    const current = link.href === "/admin" ? pathname === "/admin" || pathname === "/admin/schedule" : pathname === link.href;
    return <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>{link.label}</Link>;
  })}</nav>;
}
