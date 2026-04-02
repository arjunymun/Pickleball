import Link from "next/link";

interface WordmarkProps {
  href?: string;
  muted?: boolean;
}

export function Wordmark({ href = "/", muted = false }: WordmarkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 text-sm uppercase tracking-[0.32em] ${
        muted ? "text-[var(--sand-strong)]" : "text-[var(--ink-strong)]"
      }`}
    >
      <span className="inline-flex h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_40px_rgba(221,105,56,0.45)]" />
      <span className="font-medium">Sideout</span>
    </Link>
  );
}
