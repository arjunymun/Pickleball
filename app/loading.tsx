export default function RootLoading() {
  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="surface-card-strong rounded-[2rem] p-8">
          <p className="section-eyebrow">Loading Sideout</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            Preparing the next surface.
          </h1>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-32 animate-pulse rounded-[1.4rem] bg-[var(--background-strong)]" />
            <div className="h-32 animate-pulse rounded-[1.4rem] bg-[var(--background-strong)]" />
            <div className="h-32 animate-pulse rounded-[1.4rem] bg-[var(--background-strong)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
