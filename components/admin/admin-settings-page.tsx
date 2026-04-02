"use client";

import { useState } from "react";
import { RotateCcw, Settings2, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";

const initialNotice: NoticeState = {
  tone: "info",
  message:
    "Venue settings now live in the shared runtime, so cancellation policy, booking window, reminders, and public contact details stop being hidden constants.",
};

export function AdminSettingsPage() {
  const { adminDashboard, resetDemoState, updateVenueSettings, venueSettings } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);
  const [formState, setFormState] = useState({
    cancellationCutoffHours: String(venueSettings?.cancellationCutoffHours ?? 6),
    bookingWindowDays: String(venueSettings?.bookingWindowDays ?? 14),
    publicContactPhone: venueSettings?.publicContactPhone ?? "",
    publicContactEmail: venueSettings?.publicContactEmail ?? "",
    publicWhatsappNumber: venueSettings?.publicWhatsappNumber ?? "",
    memberDiscountPercent: String(venueSettings?.memberDiscountPercent ?? 10),
    featuredAnnouncement: venueSettings?.featuredAnnouncement ?? "",
  });

  async function runAction(action: () => Promise<string> | string) {
    try {
      const message = await action();
      setNotice({
        tone: "success",
        message,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Sideout could not complete that settings action.",
      });
    }
  }

  return (
    <div className="pt-8">
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Venue settings</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              The operational defaults behind the Sideout experience.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Cancellation rules, booking windows, reminder lead times, and contact details should be operator-owned
              settings, not values scattered through code and mock copy.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Cutoff</p>
                <p className="metric-value mt-3 text-white">{venueSettings?.cancellationCutoffHours ?? 6}h</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Window</p>
                <p className="metric-value mt-3 text-white">{venueSettings?.bookingWindowDays ?? 14}d</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Reminder leads</p>
                <p className="metric-value mt-3 text-white">
                  {(venueSettings?.reminderLeadHours ?? [24, 2]).join(" / ")}
                </p>
              </article>
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">Live policy surface</p>
            <div className="mt-5 grid gap-4">
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-[var(--accent)]" />
                  <p className="font-medium text-[var(--ink-strong)]">Member pricing and public contact stay editable</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  The same configuration drives live-mode copy, customer trust surfaces, and the operator actions behind
                  credits, reminders, and member-aware pricing.
                </p>
              </article>
              <article className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[var(--accent-green)]" />
                  <p className="font-medium text-[var(--ink-strong)]">Owner and staff can tune the venue safely</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  This gives Sideout a real first-run operator layer instead of relying on hardcoded assumptions.
                </p>
              </article>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="mt-8">
          <div
            className={`surface-card flex flex-col gap-4 rounded-[1.7rem] border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${getNoticeClasses(
              notice.tone,
            )}`}
          >
            <div>
              <p className="section-eyebrow">Live settings state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <button
              type="button"
              className="secondary-button px-4 py-2 text-sm"
              onClick={() => runAction(resetDemoState)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </section>
      </Reveal>

      <section className="mt-8">
        <Reveal delay={0.1}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Configuration"
              title="Venue rules that shape both the customer and operator experience."
              description={`These settings belong to ${adminDashboard.venue.name}. Updating them should immediately influence live-mode behavior and public trust surfaces.`}
            />
            <form
              className="mt-8 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction(() =>
                  updateVenueSettings({
                    cancellationCutoffHours: Number(formState.cancellationCutoffHours),
                    bookingWindowDays: Number(formState.bookingWindowDays),
                    publicContactPhone: formState.publicContactPhone,
                    publicContactEmail: formState.publicContactEmail,
                    publicWhatsappNumber: formState.publicWhatsappNumber,
                    memberDiscountPercent: Number(formState.memberDiscountPercent),
                    featuredAnnouncement: formState.featuredAnnouncement,
                    reminderLeadHours: venueSettings?.reminderLeadHours ?? [24, 2],
                  }),
                );
              }}
            >
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Cancellation cutoff hours</span>
                <input
                  value={formState.cancellationCutoffHours}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, cancellationCutoffHours: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Booking window days</span>
                <input
                  value={formState.bookingWindowDays}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, bookingWindowDays: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Public phone</span>
                <input
                  value={formState.publicContactPhone}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, publicContactPhone: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Public email</span>
                <input
                  value={formState.publicContactEmail}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, publicContactEmail: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">WhatsApp number</span>
                <input
                  value={formState.publicWhatsappNumber}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, publicWhatsappNumber: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Member discount percent</span>
                <input
                  value={formState.memberDiscountPercent}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, memberDiscountPercent: event.target.value }))
                  }
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-medium text-[var(--ink-strong)]">Featured announcement</span>
                <textarea
                  value={formState.featuredAnnouncement}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, featuredAnnouncement: event.target.value }))
                  }
                  rows={4}
                  className="rounded-[1.2rem] border border-[var(--line-soft)] bg-white/70 px-4 py-3"
                />
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="primary-button px-4 py-2 text-sm">
                  Save venue settings
                </button>
              </div>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
