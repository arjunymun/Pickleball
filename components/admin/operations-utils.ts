import { ACADEMY } from "@/lib/academy/config";
import type { AcademyMembership, BookingSource } from "@/lib/academy/contracts";
import { addDays, slotStart } from "@/lib/academy/time";

export const sourceLabels: Record<BookingSource, string> = { online: "Online", walk_in: "Walk-in", phone: "Phone", playo: "Playo", hudle: "Hudle", district: "District", individual_play: "Individual play" };
export function displayStatus(value: string): string { return value.replaceAll("_", " "); }
export function parseRupees(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error("Enter a valid amount in rupees, with at most two decimal places.");
  const [whole, decimal = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount > 500_000) throw new Error("Enter an amount between ₹0 and ₹5,000.");
  return amount;
}
export function hourEnd(date: string, hour: number): string { return hour === ACADEMY.closingHour ? slotStart(addDays(date, 1), 0) : slotStart(date, hour); }
export function paidMember(membership: AcademyMembership | null, startsAt = new Date().toISOString()): boolean {
  return Boolean(membership?.status === "active" && membership.paidThrough && membership.currentPeriodStart && new Date(membership.currentPeriodStart).getTime() <= new Date(startsAt).getTime() && new Date(membership.paidThrough).getTime() > new Date(startsAt).getTime());
}

// An uncertain network response must retry the same operation rather than create a second reservation.
export function requestKey(ref: { current: { signature: string; key: string } | null }, body: unknown): string {
  const signature = JSON.stringify(body);
  if (!ref.current || ref.current.signature !== signature) ref.current = { signature, key: crypto.randomUUID() };
  return ref.current.key;
}
