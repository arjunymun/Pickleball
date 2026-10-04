"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import styles from "@/components/customer/academy-customer.module.css";

export function SignOutButton({
  label = "",
  inverted = false,
}: {
  label?: string;
  inverted?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const { error: authError } =
        await createBrowserSupabaseClient().auth.signOut();
      if (authError) throw authError;
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button
        className={styles.signout}
        style={inverted ? { color: "white" } : undefined}
        onClick={() => void signOut()}
        disabled={busy}
        aria-label={label ? `Sign out ${label}` : "Sign out"}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <span role="alert" className={styles.small}>
          {error}
        </span>
      )}
    </span>
  );
}
