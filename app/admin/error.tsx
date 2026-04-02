"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mt-8 surface-card-dark rounded-[2rem] p-8">
      <p className="section-eyebrow !text-white/55">Operator error</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
        The operator console needs another load.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
        {error.message || "Something went wrong while loading the operator experience."}
      </p>
      <button type="button" className="primary-button mt-6 px-4 py-2 text-sm" onClick={reset}>
        Retry operator console
      </button>
    </section>
  );
}
