import type { AvailabilityState } from "@/lib/domain";

export type NoticeTone = "info" | "success" | "error";

export interface NoticeState {
  tone: NoticeTone;
  message: string;
}

export function formatModeLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function getAvailabilityClasses(value: AvailabilityState | "booked") {
  if (value === "open") {
    return "status-open";
  }

  if (value === "limited") {
    return "status-limited";
  }

  return "status-booked";
}

export function getNoticeClasses(tone: NoticeTone) {
  if (tone === "success") {
    return "border-[rgba(31,106,84,0.18)] bg-[rgba(31,106,84,0.08)] text-[var(--ink-strong)]";
  }

  if (tone === "error") {
    return "border-[rgba(221,105,56,0.2)] bg-[rgba(221,105,56,0.08)] text-[var(--ink-strong)]";
  }

  return "border-[var(--line-soft)] bg-white/65 text-[var(--ink-strong)]";
}
