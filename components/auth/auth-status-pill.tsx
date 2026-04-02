import Link from "next/link";
import { DatabaseZap, LockKeyhole, UserRound } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthState } from "@/lib/auth";

interface AuthStatusPillProps {
  inverted?: boolean;
}

export async function AuthStatusPill({ inverted = false }: AuthStatusPillProps) {
  const authState = await getAuthState();

  if (authState.user) {
    const label =
      authState.user.phone ??
      authState.user.email ??
      authState.user.fullName ??
      "player";

    return <SignOutButton label={label} inverted={inverted} />;
  }

  if (authState.isConfigured) {
    return (
      <Link
        href="/sign-in"
        className={inverted ? "secondary-button secondary-button-dark px-4 py-2 text-sm" : "secondary-button px-4 py-2 text-sm"}
      >
        <LockKeyhole className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
        inverted ? "bg-white/6 text-white" : "bg-[var(--background-strong)] text-[var(--ink-soft)]"
      }`}
    >
      {inverted ? <UserRound className="h-4 w-4" /> : <DatabaseZap className="h-4 w-4" />}
      Demo backend
    </span>
  );
}
