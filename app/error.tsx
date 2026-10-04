"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AcademyBrand } from "@/components/academy/brand";
import { ACADEMY } from "@/lib/academy/config";
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[academy] route error", { digest: error.digest });
  }, [error]);
  return (
    <main id="main-content" className="academy-container academy-empty">
      <AcademyBrand />
      <p className="academy-eyebrow">Unable to load this page</p>
      <h1 className="academy-heading">Please try again.</h1>
      <p>
        We couldn&apos;t load this page. If you were making a payment, check My
        Bookings before trying another payment.
      </p>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}
      >
        <button type="button" className="academy-button" onClick={reset}>
          Try again
        </button>
        <Link className="academy-button-secondary" href="/app/bookings">
          My Bookings
        </Link>
        <a className="academy-button-secondary" href={ACADEMY.phoneHref}>
          Call the academy
        </a>
      </div>
      {error.digest && (
        <p className="academy-muted">Reference: {error.digest}</p>
      )}
    </main>
  );
}
