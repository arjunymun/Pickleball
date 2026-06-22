"use client";

import { useEffect } from "react";

// Last-resort boundary: catches errors thrown by the root layout itself, where globals.css
// and the theme script may not have run. It must render its own <html>/<body> and therefore
// styles inline (hardcoded brand palette, light theme) rather than relying on app classes.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sideout] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(135deg, #fbf5ee 0%, #f0e0cc 100%)",
          color: "#15201b",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 560, width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 9999, background: "#dd6938" }} />
            <span style={{ fontWeight: 600 }}>Sideout</span>
          </div>
          <h1 style={{ marginTop: 24, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 700 }}>
            Something broke while starting up.
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: "rgba(21,32,27,0.74)" }}>
            Sideout could not load the page shell. Reload to try again — if it keeps happening, come back in a
            moment.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(21,32,27,0.5)",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              border: "none",
              cursor: "pointer",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              background: "linear-gradient(135deg, #dd6938 0%, #f49d52 100%)",
            }}
          >
            Reload Sideout
          </button>
        </main>
      </body>
    </html>
  );
}
