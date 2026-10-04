"use client";
import Link from "next/link";
import styles from "@/components/customer/academy-customer.module.css";
export default function CustomerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.empty}>
        <h1 className="academy-heading">We couldn&apos;t load your account.</h1>
        <p>Please try again. If this keeps happening, contact the academy.</p>
        <div className={styles.actionRow}>
          <button className="academy-button" onClick={reset}>
            Try again
          </button>
          <Link href="/contact" className="academy-button-secondary">
            Contact the academy
          </Link>
        </div>
      </div>
    </div>
  );
}
