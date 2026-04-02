"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mt-8 surface-card-strong rounded-[2rem] p-8">
      <p className="section-eyebrow">Customer app error</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
        This club surface needs a refresh.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
        {error.message || "Something went wrong while loading the customer experience."}
      </p>
      <button type="button" className="primary-button mt-6 px-4 py-2 text-sm" onClick={reset}>
        Retry customer app
      </button>
    </section>
  );
}
