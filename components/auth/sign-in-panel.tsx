"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/env";

interface SignInPanelProps {
  isSupabaseConfigured: boolean;
}

type SubmitState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialSubmitState: SubmitState = {
  tone: "idle",
  message: "Use a real Supabase project to send a magic link or create password-based auth in the next iteration.",
};

export function SignInPanel({ isSupabaseConfigured }: SignInPanelProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);

  const redirectUrl = useMemo(() => `${getSiteUrl()}/auth/callback?next=/app`, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setSubmitState({
        tone: "error",
        message: "Supabase environment variables are missing. Add them in .env.local before trying the real auth flow.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setSubmitState({
        tone: "success",
        message: `Magic link sent to ${email}. Open it on this device and Sideout will redirect you back into the app.`,
      });
    } catch (error) {
      setSubmitState({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not start the auth flow.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
        <p className="section-eyebrow">Sign in</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
          Real auth, still graceful on localhost.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
          Version 1.3 wires Sideout into a real Supabase auth path without sacrificing the demo mode that keeps local
          product review fast.
        </p>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--ink-strong)]">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@sideout.club"
              className="rounded-[1.3rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3 text-base text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button type="submit" className="primary-button w-fit px-5 py-3 text-sm" disabled={isSubmitting}>
            <Mail className="h-4 w-4" />
            {isSubmitting ? "Sending link..." : "Send magic link"}
          </button>
        </form>
        <div
          className={`mt-6 rounded-[1.5rem] border px-4 py-4 text-sm leading-7 ${
            submitState.tone === "success"
              ? "border-[rgba(31,106,84,0.18)] bg-[rgba(31,106,84,0.08)] text-[var(--ink-strong)]"
              : submitState.tone === "error"
                ? "border-[rgba(221,105,56,0.2)] bg-[rgba(221,105,56,0.08)] text-[var(--ink-strong)]"
                : "border-[var(--line-soft)] bg-white/65 text-[var(--ink-soft)]"
          }`}
        >
          {submitState.message}
        </div>
      </section>

      <section className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
        <p className="section-eyebrow !text-white/55">Backend mode</p>
        <div className="mt-5 grid gap-4">
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">
                {isSupabaseConfigured ? "Supabase configured" : "Demo mode active"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {isSupabaseConfigured
                ? "Magic-link authentication is ready. The callback route and session refresh path are already wired."
                : "Local review still works without any keys. Add your Supabase URL and anon key in .env.local to enable real auth."}
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">Next backend step</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              After auth, the next upgrade is swapping the live demo store for real Supabase queries and role-aware mutations.
            </p>
          </article>
          <a
            href="/app"
            className="secondary-button secondary-button-dark mt-2 w-fit px-4 py-2 text-sm"
          >
            Continue in demo mode
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
