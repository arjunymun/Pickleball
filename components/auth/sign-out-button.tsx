"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
  label: string;
  inverted?: boolean;
}

export function SignOutButton({ label, inverted = false }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
      } finally {
        router.push("/sign-in");
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      className={inverted ? "secondary-button secondary-button-dark px-4 py-2 text-sm" : "secondary-button px-4 py-2 text-sm"}
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : `Sign out ${label}`}
    </button>
  );
}
