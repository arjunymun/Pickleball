"use client";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="academy-card"><p className="academy-eyebrow">Staff tools</p><h1>Unable to load operations.</h1><p>The academy service could not load this screen. Your existing reservations are unchanged.</p><button className="academy-button" type="button" onClick={reset}>Try again</button></section>;
}
