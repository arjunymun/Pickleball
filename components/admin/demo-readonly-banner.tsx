import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Shown at the top of the production /admin/* surfaces when they are backed by the local demo
 * runtime (no Supabase). In that state every operator action throws "Demo actions live on
 * /demo...", so the banner sets expectations and points to the interactive walkthrough while the
 * pages disable their action buttons.
 */
export function DemoReadOnlyBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 text-[var(--accent)]" />
        <p className="font-medium text-[var(--accent)]">
          Viewing in read-only demo mode — operator actions are disabled here.
        </p>
      </div>
      <Link href="/demo/operator" className="primary-button px-4 py-2 text-sm">
        Visit /demo/operator for the interactive walkthrough
      </Link>
    </div>
  );
}
