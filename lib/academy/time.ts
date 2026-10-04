import { ACADEMY } from "@/lib/academy/config";

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: ACADEMY.timezone, year: "numeric", month: "2-digit", day: "2-digit" });

export function indiaDate(value: Date | string = new Date()): string {
  const parts = dayFormatter.formatToParts(new Date(value));
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function addDays(date: string, amount: number): string {
  if (!isValidDate(date) || !Number.isInteger(amount)) throw new Error("Invalid calendar date.");
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function slotStart(date: string, hour: number): string {
  if (!isValidDate(date) || !Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("Invalid court time.");
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+05:30`).toISOString();
}
export function bookingDates(now: Date = new Date()): string[] {
  const first = indiaDate(now);
  return Array.from({ length: ACADEMY.bookingWindowDays }, (_, index) => addDays(first, index));
}
export function formatCourtDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = isValidDate(value) ? new Date(`${value}T12:00:00+05:30`) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", { timeZone: ACADEMY.timezone, weekday: "short", day: "numeric", month: "short", ...options }).format(date);
}
export function formatCourtTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: ACADEMY.timezone, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
}
export function hourInIndia(value: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: ACADEMY.timezone, hour: "2-digit", hourCycle: "h23" }).format(new Date(value)));
}
