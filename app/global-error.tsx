"use client";
import { useEffect } from "react";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[academy] layout error", { digest: error.digest });
  }, [error]);
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 24,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#123a6b",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main id="main-content" style={{ width: "100%", maxWidth: 560 }}>
          <p>Doon Pickleball Academy</p>
          <h1>We couldn&apos;t load this page.</h1>
          <p style={{ lineHeight: 1.6 }}>
            Please try again. If you were paying for a booking, check its status
            before making another payment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "14px 24px",
              border: 0,
              borderRadius: 6,
              background: "#123a6b",
              color: "#fff",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <p>
            <a href="tel:+919798098421" style={{ color: "inherit" }}>
              Call +91 97980 98421
            </a>
          </p>
          {error.digest && <p>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
