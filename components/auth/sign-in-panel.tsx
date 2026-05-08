"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MessageSquareMore,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface SignInPanelProps {
  isSupabaseConfigured: boolean;
}

type AuthMode = "customer" | "operator";
type PortfolioRole = "customer" | "operator";

type SubmitState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialSubmitState: SubmitState = {
  tone: "idle",
  message:
    "Use the live Sideout accounts for a real Supabase session now. SMS and email provider auth remain available when those providers are configured.",
};

export function SignInPanel({ isSupabaseConfigured }: SignInPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("customer");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [activePortfolioRole, setActivePortfolioRole] = useState<PortfolioRole | null>(null);

  const operatorRedirectUrl = useMemo(() => {
    const origin = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;
    return `${origin}/auth/callback?next=/admin`;
  }, []);

  async function enterPortfolioAccount(role: PortfolioRole) {
    if (!isSupabaseConfigured) {
      setSubmitState({
        tone: "error",
        message: "Supabase is not configured yet. Add the URL, anon key, and service role key in .env.local first.",
      });
      return;
    }

    setIsSubmitting(true);
    setActivePortfolioRole(role);
    setSubmitState({
      tone: "idle",
      message:
        role === "operator"
          ? "Preparing the operator account, venue role, and live Supabase session."
          : "Preparing the customer account, member profile, and live Supabase session.",
    });

    try {
      const response = await fetch("/api/portfolio/live-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      const payload = (await response.json()) as {
        email?: string;
        password?: string;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.email || !payload.password) {
        throw new Error(payload.error ?? "Sideout could not prepare the live account.");
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) {
        throw error;
      }

      setSubmitState({
        tone: "success",
        message:
          role === "operator"
            ? "Operator session ready. Opening the venue command center."
            : "Customer session ready. Opening the court booking flow.",
      });

      router.push(payload.redirectTo ?? (role === "operator" ? "/admin" : "/app/bookings"));
      router.refresh();
    } catch (error) {
      setSubmitState({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not create a live sign-in session.",
      });
    } finally {
      setIsSubmitting(false);
      setActivePortfolioRole(null);
    }
  }

  async function handleOperatorSubmit(event: FormEvent<HTMLFormElement>) {
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
          emailRedirectTo: operatorRedirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setSubmitState({
        tone: "success",
        message: `Magic link sent to ${email}. Open it on this device and Sideout will return you to the operator console.`,
      });
    } catch (error) {
      setSubmitState({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not start the operator auth flow.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
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
      const trimmedPhone = phone.replace(/\s+/g, "");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: trimmedPhone,
        options: {
          data: {
            phone: trimmedPhone,
          },
        },
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);
      setSubmitState({
        tone: "success",
        message: `OTP sent to ${trimmedPhone}. Enter the code below to continue into the customer app.`,
      });
    } catch (error) {
      setSubmitState({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not send the phone OTP.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
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
      const trimmedPhone = phone.replace(/\s+/g, "");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: trimmedPhone,
        token: otp.trim(),
        type: "sms",
      });

      if (error) {
        throw error;
      }

      setSubmitState({
        tone: "success",
        message: "Phone verified. Redirecting you into the Sideout customer app.",
      });
      router.push("/app/bookings");
      router.refresh();
    } catch (error) {
      setSubmitState({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not verify that OTP.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <section className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-eyebrow">Live access</span>
          <span className="rounded-full border border-[rgba(31,106,84,0.18)] bg-[rgba(31,106,84,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
            May 2026 workspace
          </span>
        </div>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
          Enter the real Sideout booking platform.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
          Start with a real Supabase Auth session. Customer access opens the booking flow; operator access opens the
          venue operating system.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            className="group rounded-[1.5rem] border border-[rgba(31,106,84,0.2)] bg-[rgba(31,106,84,0.08)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[rgba(31,106,84,0.35)] hover:bg-[rgba(31,106,84,0.12)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isSubmitting}
            onClick={() => void enterPortfolioAccount("customer")}
          >
            <span className="flex items-center justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--accent-deep)] shadow-sm">
                <UserRound className="h-5 w-5" />
              </span>
              {activePortfolioRole === "customer" ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-deep)]" />
              ) : (
                <ArrowRight className="h-5 w-5 text-[var(--accent-deep)] transition group-hover:translate-x-0.5" />
              )}
            </span>
            <span className="mt-5 block text-lg font-semibold text-[var(--ink-strong)]">Live customer account</span>
            <span className="mt-2 block text-sm leading-6 text-[var(--ink-soft)]">
              Sign in as a player, view May availability, hold a slot, and continue to checkout.
            </span>
          </button>
          <button
            type="button"
            className="group rounded-[1.5rem] border border-[rgba(11,31,39,0.14)] bg-white/75 p-5 text-left shadow-[0_18px_45px_rgba(11,31,39,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(11,31,39,0.28)] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={isSubmitting}
            onClick={() => void enterPortfolioAccount("operator")}
          >
            <span className="flex items-center justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink-strong)] text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              {activePortfolioRole === "operator" ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-strong)]" />
              ) : (
                <ArrowRight className="h-5 w-5 text-[var(--ink-strong)] transition group-hover:translate-x-0.5" />
              )}
            </span>
            <span className="mt-5 block text-lg font-semibold text-[var(--ink-strong)]">Live operator account</span>
            <span className="mt-2 block text-sm leading-6 text-[var(--ink-soft)]">
              Sign in as staff, manage the court schedule, blocks, pricing, bookings, and revenue.
            </span>
          </button>
        </div>

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

        <div className="mt-8 rounded-[1.5rem] border border-[var(--line-soft)] bg-white/55 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-strong)]">Provider auth rails</p>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                Use these when Supabase SMS or email delivery is configured for production.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-[var(--line-soft)] bg-white/80 p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "customer" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-soft)]"
                }`}
                onClick={() => setMode("customer")}
              >
                SMS OTP
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "operator" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-soft)]"
                }`}
                onClick={() => setMode("operator")}
              >
                Email link
              </button>
            </div>
          </div>

        {mode === "customer" ? (
          <div className="mt-8 grid gap-4">
            <form className="grid gap-4" onSubmit={handlePhoneSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Phone number</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                  className="rounded-[1.3rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3 text-base text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <button type="submit" className="primary-button w-fit px-5 py-3 text-sm" disabled={isSubmitting}>
                <Smartphone className="h-4 w-4" />
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            {otpSent ? (
              <form className="grid gap-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-white/55 p-4" onSubmit={handleOtpVerify}>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--ink-strong)]">Verification code</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                    className="rounded-[1.1rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3 text-base text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
                <button type="submit" className="primary-button w-fit px-5 py-3 text-sm" disabled={isSubmitting}>
                  <MessageSquareMore className="h-4 w-4" />
                  {isSubmitting ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={handleOperatorSubmit}>
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
        )}
        </div>
      </section>

      <section className="surface-card-dark rounded-[2rem] p-6 sm:p-7">
        <p className="section-eyebrow !text-white/55">System status</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">A real entry point for the club OS.</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">
          This page now gives you a working route into the product while still exposing the real production auth
          options Sideout will use.
        </p>
        <div className="mt-6 grid gap-4">
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">
                {isSupabaseConfigured ? "Supabase keys present" : "Supabase missing"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {isSupabaseConfigured
                ? "The live account buttons validate the active project, create confirmed Auth users, and sign into the browser session with password auth."
                : "Add your Supabase URL, anon key, and service role key in .env.local before using live account access."}
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">Booking-ready path</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Customer sessions land on May availability. Operator sessions land on the live venue dashboard and schedule.
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">Recruiter walkthrough</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              The separate demo site stays available for explaining the product story, but the main app now points to
              the real booking stack.
            </p>
          </article>
          <a href="/demo" className="secondary-button secondary-button-dark mt-2 w-fit px-4 py-2 text-sm">
            Open recruiter demo
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
