"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, Mail, MessageSquareMore, Smartphone } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/env";

interface SignInPanelProps {
  isSupabaseConfigured: boolean;
}

type AuthMode = "customer" | "operator";

type SubmitState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialSubmitState: SubmitState = {
  tone: "idle",
  message:
    "Phone OTP is the primary customer path now. Operators can still use email magic links for owner and staff access.",
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

  const operatorRedirectUrl = useMemo(() => `${getSiteUrl()}/auth/callback?next=/admin`, []);

  async function handleOperatorSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  async function handlePhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  async function handleOtpVerify(event: React.FormEvent<HTMLFormElement>) {
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
      router.push("/app");
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
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="surface-card-strong rounded-[2rem] p-6 sm:p-8">
        <p className="section-eyebrow">Sign in</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-6xl">
          Phone-first for players, email-capable for operators.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
          Sideout now matches the product plan more closely: customers can enter with phone OTP, while owner and staff
          access still works through a clean email magic-link flow.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-[var(--line-soft)] bg-white/65 p-1">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "customer" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-soft)]"
            }`}
            onClick={() => setMode("customer")}
          >
            Customer phone OTP
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "operator" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-soft)]"
            }`}
            onClick={() => setMode("operator")}
          >
            Operator email link
          </button>
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
                ? "Customer OTP and operator magic-link entry are ready. After sign-in, initialize the live venue once and the customer/admin shells will promote onto Supabase records."
                : "Local review still works without any keys. Add your Supabase URL and anon key in .env.local to enable the real auth and live venue flow."}
            </p>
          </article>
          <article className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white/80" />
              <p className="font-medium text-white">First-run state</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Signed out, signed in without a venue, and live venue-ready are now different product states instead of
              collapsing back into the same demo shell.
            </p>
          </article>
          <a href="/app" className="secondary-button secondary-button-dark mt-2 w-fit px-4 py-2 text-sm">
            Continue in demo mode
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
