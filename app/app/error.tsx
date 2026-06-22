"use client";

import { useEffect } from "react";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sideout] customer app error", error);
  }, [error]);

  return (
    <section className="mt-8 surface-card-strong rounded-[2rem] p-8">
      <p className="section-eyebrow">Customer app error</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
        This club surface needs a refresh.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
        Something went wrong while loading the customer experience. Give it another go below.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">Reference: {error.digest}</p>
      ) : null}
      <button type="button" className="primary-button mt-6 px-4 py-2 text-sm" onClick={reset}>
        Retry customer app
      </button>
    </section>
  );
}
