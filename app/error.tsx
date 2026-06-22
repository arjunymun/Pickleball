"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the browser console and Vercel runtime logs; the raw message
    // is intentionally kept out of the UI so client-side internals are not shown to visitors.
    console.error("[sideout] root route error", error);
  }, [error]);

  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="surface-card-dark rounded-[2rem] p-8">
          <p className="section-eyebrow !text-white/55">Sideout hit an error</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            The venue surface needs another pass.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
            Something went wrong while loading this route. Give it another go below — if it keeps happening,
            refresh in a moment.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/40">Reference: {error.digest}</p>
          ) : null}
          <button type="button" className="primary-button mt-8 px-4 py-2 text-sm" onClick={reset}>
            Retry this surface
          </button>
        </div>
      </div>
    </main>
  );
}
