"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="surface-card-dark rounded-[2rem] p-8">
          <p className="section-eyebrow !text-white/55">Sideout hit an error</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            The venue surface needs another pass.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
            {error.message || "Something went wrong while loading this route."}
          </p>
          <button type="button" className="primary-button mt-8 px-4 py-2 text-sm" onClick={reset}>
            Retry this surface
          </button>
        </div>
      </div>
    </main>
  );
}
