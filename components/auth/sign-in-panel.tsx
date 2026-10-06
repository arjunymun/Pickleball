"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ACADEMY } from "@/lib/academy/config";
import { safeReturnPath } from "./safe-return";
import styles from "@/components/customer/academy-customer.module.css";

export function SignInPanel({
  next = "/app",
  initialError,
  configured,
  emailConfigured = false,
}: {
  next?: string;
  initialError?: string | null;
  configured: boolean;
  emailConfigured?: boolean;
}) {
  const enabled =
    configured && process.env.NEXT_PUBLIC_ACADEMY_BACKEND_ENABLED === "true";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [notice, setNotice] = useState<string | null>(
    initialError
      ? "Your sign-in link could not complete. Please request a new link or try Google."
      : null,
  );
  const [sent, setSent] = useState(false);
  const returnPath = safeReturnPath(next);
  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`;
  }
  async function googleSignIn() {
    if (!enabled || busy) return;
    setBusy("google");
    setNotice(null);
    try {
      const { error } =
        await createBrowserSupabaseClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl() },
        });
      if (error) throw error;
    } catch {
      setNotice(
        "Google sign-in is unavailable right now. Try an email link or call the academy for help.",
      );
      setBusy(null);
    }
  }
  async function emailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || !emailConfigured || busy) return;
    setBusy("email");
    setNotice(null);
    setSent(false);
    try {
      const { error } = await createBrowserSupabaseClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      setSent(true);
      setNotice(
        `Check ${email.trim()} for your sign-in link. Open it in this browser to continue where you left off.`,
      );
    } catch {
      setNotice(
        "We couldn't send your sign-in link. Try again in a moment, use Google, or call the academy for help.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className={styles.authLayout}>
      <div className={styles.authPhoto}>
        <Image
          src={ACADEMY.photos.courts}
          alt="The academy's outdoor blue courts under floodlights"
          fill
          priority
          sizes="50vw"
        />
      </div>
      <section className={styles.authForm}>
        <h1 className="academy-heading">
          Your game.
          <br />
          Your account.
        </h1>
        <p className={styles.intro}>
          Sign in to book a court, find your reservations and manage your
          membership.
        </p>
        {!enabled && (
          <p role="status" className={styles.notice}>
            Online sign-in is currently unavailable. You can browse the academy
            and call <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a> to arrange
            a game.
          </p>
        )}
        <button
          className={`academy-button-secondary ${styles.googleButton}`}
          disabled={!enabled || busy !== null}
          onClick={() => void googleSignIn()}
        >
          <span className={styles.googleMark} aria-hidden="true">
            G
          </span>
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
        {emailConfigured ? (
          <>
            <div className={styles.divider}>or use your email</div>
            <form onSubmit={(event) => void emailSignIn(event)}>
              <label className={styles.field}>
                Email address
                <input
                  className="academy-input"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={!enabled || busy !== null}
                />
              </label>
              <button
                type="submit"
                className={`academy-button ${styles.fullButton}`}
                disabled={!enabled || busy !== null}
              >
                {busy === "email"
                  ? "Sending your link…"
                  : sent
                    ? "Send another sign-in link"
                    : "Email me a sign-in link"}
              </button>
            </form>
          </>
        ) : (
          enabled && (
            <p role="status" className={styles.small}>
              Email sign-in is currently unavailable. Continue with Google or
              call the academy for help.
            </p>
          )
        )}
        {notice && (
          <p
            role={sent ? "status" : "alert"}
            className={sent ? styles.notice : styles.error}
          >
            {notice}
          </p>
        )}
        <p className={styles.small}>
          No password needed. New here? Your player account is created when you
          sign in. By continuing, you agree to our{" "}
          <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy notice</Link>.
        </p>
        <Link href="/book" className={styles.small}>
          Back to court availability
        </Link>
      </section>
    </div>
  );
}
