"use client";

import { RotateCcw, Send, Smartphone } from "lucide-react";

import { DemoReadOnlyBanner } from "@/components/admin/demo-readonly-banner";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSideoutDemo } from "@/lib/demo-store";
import { getNoticeClasses, type NoticeState } from "@/lib/preview-ui";
import { useState } from "react";

const READ_ONLY_TOOLTIP = "Disabled in read-only demo. Visit /demo/operator for the interactive walkthrough.";

const initialNotice: NoticeState = {
  tone: "info",
  message:
    "WhatsApp templates and delivery history in one place — confirmations, reminders, and recovery nudges, next to the bookings they're about.",
};

export function AdminCommunicationsPage() {
  const { adminDashboard, isReadOnlyDemo, resetDemoState, sendCommunication } = useSideoutDemo();
  const [notice, setNotice] = useState<NoticeState>(initialNotice);

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
        message: error instanceof Error ? error.message : "Sideout could not complete that messaging action.",
      });
    }
  }

  return (
    <div className="pt-8">
      {isReadOnlyDemo ? (
        <div className="mb-8">
          <DemoReadOnlyBanner />
        </div>
      ) : null}
      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="surface-card-dark rounded-[2rem] p-6 sm:p-8">
            <p className="section-eyebrow !text-white/55">Communications</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              WhatsApp that lives with the bookings.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Confirmations, recovery nudges, and membership reminders sit right next to the bookings and credits
              they&apos;re about, so every message carries the context behind it.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Templates</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.communicationTemplates.length}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Recent sends</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.communicationDeliveries.length}</p>
              </article>
              <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="section-eyebrow !text-white/45">Inactive players</p>
                <p className="metric-value mt-3 text-white">{adminDashboard.customerSegments.inactivePlayers}</p>
              </article>
            </div>
          </div>

          <div className="surface-card-strong rounded-[2rem] p-6 sm:p-7">
            <p className="section-eyebrow">Recent operator activity</p>
            <div className="mt-5 grid gap-4">
              {adminDashboard.operatorActivity.slice(0, 4).map((entry) => (
                <article key={entry.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-4">
                  <p className="text-sm font-medium text-[var(--ink-strong)]">{entry.action.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{entry.detail}</p>
                </article>
              ))}
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
              <p className="section-eyebrow">Live communications state</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{notice.message}</p>
            </div>
            <button
              type="button"
              className="secondary-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReadOnlyDemo}
              title={isReadOnlyDemo ? READ_ONLY_TOOLTIP : undefined}
              onClick={() => runAction(resetDemoState)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </section>
      </Reveal>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal delay={0.1}>
          <div className="surface-card-strong rounded-[2rem] p-6">
            <SectionHeading
              eyebrow="Templates"
              title="Reusable WhatsApp flows tied to real product moments."
              description="The template layer keeps the operator fast without reducing everything to generic notifications."
            />
            <div className="mt-8 grid gap-4">
              {adminDashboard.communicationTemplates.map((template) => (
                <article key={template.id} className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/75 p-5">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-[var(--accent)]" />
                    <p className="font-medium text-[var(--ink-strong)]">{template.title}</p>
                  </div>
                  <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">{template.slug}</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{template.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="grid gap-5">
            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">At-risk sends</p>
              <div className="mt-5 grid gap-4">
                {adminDashboard.atRiskCustomers.slice(0, 3).map((entry) => (
                  <div key={entry.profile.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <p className="font-medium text-[var(--ink-strong)]">{entry.user.name}</p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      {entry.daysSinceLastAttendance} days inactive / {entry.profile.favoriteWindow}
                    </p>
                    <button
                      type="button"
                      className="primary-button mt-4 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isReadOnlyDemo}
                      title={isReadOnlyDemo ? READ_ONLY_TOOLTIP : undefined}
                      onClick={() =>
                        runAction(() =>
                          sendCommunication(
                            entry.profile.id,
                            "template-sunrise-recovery",
                            `Sideout prepared a recovery WhatsApp for ${entry.user.name}.`,
                          ),
                        )
                      }
                    >
                      <Send className="h-4 w-4" />
                      Send recovery nudge
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <p className="section-eyebrow">Delivery log</p>
              <div className="mt-5 grid gap-4">
                {adminDashboard.communicationDeliveries.slice(0, 4).map((delivery) => (
                  <div key={delivery.id} className="rounded-[1.3rem] bg-white/70 p-4">
                    <p className="text-sm font-medium text-[var(--ink-strong)]">{delivery.status}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{delivery.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
