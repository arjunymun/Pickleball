import { describe, expect, it } from "vitest";
import type { AcademyBooking, AcademyMembership, AdminSchedulePayload } from "@/lib/academy/contracts";
import { slotStart } from "@/lib/academy/time";
import { firstAvailableEntrySlot, hourEnd, paidMember, parseRupees, requestKey } from "./operations-utils";

describe("staff money entry", () => {
  it.each([["500", 50000], ["400", 40000], ["125", 12500], ["0", 0], ["12.05", 1205], [" 500.00 ", 50000], ["5000", 500000]])("converts %s rupees exactly to paise", (input, expected) => { expect(parseRupees(input)).toBe(expected); });
  it.each(["", "-1", "1e3", "NaN", "Infinity", "125.005", "₹500", "1,000", "5000.01", "99999999999999999"])("rejects unsafe or unsupported amount %s", (input) => { expect(() => parseRupees(input)).toThrow(); });
});
describe("staff reservation retry", () => {
  it("reuses the key after an uncertain network response and changes it for a new operation", () => {
    const ref = { current: null as { signature: string; key: string } | null };
    const original = requestKey(ref, { courtId: "one", startsAt: "2026-10-03T00:30:00Z", amountPaise: 50000 });
    expect(requestKey(ref, { courtId: "one", startsAt: "2026-10-03T00:30:00Z", amountPaise: 50000 })).toBe(original);
    expect(requestKey(ref, { courtId: "two", startsAt: "2026-10-03T00:30:00Z", amountPaise: 50000 })).not.toBe(original);
  });
});
describe("staff membership eligibility", () => {
  const membership: AcademyMembership = { id: "member", customerId: "player", status: "active", currentPeriodStart: "2026-10-01T18:30:00Z", paidThrough: "2026-11-01T18:30:00Z", cancelAtPeriodEnd: false, subscriptionId: "subscription" };
  it("honors the verified paid period including end-of-period cancellation", () => {
    expect(paidMember(membership, "2026-10-01T18:29:59Z")).toBe(false);
    expect(paidMember(membership, "2026-10-01T18:30:00Z")).toBe(true);
    expect(paidMember({ ...membership, cancelAtPeriodEnd: true }, "2026-10-31T23:00:00Z")).toBe(true);
    expect(paidMember(membership, "2026-11-01T18:30:00Z")).toBe(false);
  });
  it.each(["pending", "past_due", "cancelled", "expired"] as const)("does not grant benefits for %s membership", (status) => { expect(paidMember({ ...membership, status }, "2026-10-10T00:30:00Z")).toBe(false); });
  it("denies a missing or invalid paid period", () => {
    expect(paidMember(null)).toBe(false);
    expect(paidMember({ ...membership, paidThrough: null })).toBe(false);
    expect(paidMember({ ...membership, currentPeriodStart: "invalid" })).toBe(false);
  });
});
describe("maintenance midnight", () => {
  it("uses next-day midnight in IST across a year boundary", () => { expect(hourEnd("2026-12-31", 24)).toBe("2026-12-31T18:30:00.000Z"); });
  it("preserves normal same-day IST block end", () => { expect(hourEnd("2026-10-03", 8)).toBe("2026-10-03T02:30:00.000Z"); });
});
describe("staff quick-add slot", () => {
  const date = "2026-10-06";
  const courts = Array.from({ length: 2 }, (_, index) => ({ id: `court-${index + 1}`, name: `Court ${index + 1}`, number: index + 1 }));
  const schedule: AdminSchedulePayload = { date, courts, bookings: [], blocks: [], metrics: { bookingCount: 0, collectedPaise: 0, refundedPaise: 0, occupiedHours: 0 }, paymentMode: "test" };
  function reservation(courtId: string, hour: number): AcademyBooking {
    return { id: `${courtId}-${hour}`, courtId, courtName: courtId, customerId: null, customerName: "Player", startsAt: slotStart(date, hour), endsAt: hourEnd(date, hour + 1), status: "confirmed", paymentStatus: "paid", amountPaise: 50000, refundedPaise: 0, holdExpiresAt: null, source: "online", reference: null, reason: null, createdAt: slotStart(date, 5) };
  }
  it("starts at opening before hours begin and at the current open hour today", () => {
    expect(firstAvailableEntrySlot(schedule, date, "all", Date.parse(slotStart(date, 5)))).toEqual({ courtId: "court-1", hour: 6 });
    expect(firstAvailableEntrySlot(schedule, date, "all", Date.parse(slotStart(date, 9)))).toEqual({ courtId: "court-1", hour: 9 });
  });
  it("chooses the first future opening for a later date and filters the selected court", () => {
    expect(firstAvailableEntrySlot({ ...schedule, date: "2026-10-07" }, "2026-10-07", "all", Date.parse(slotStart(date, 12)))).toEqual({ courtId: "court-1", hour: 6 });
    expect(firstAvailableEntrySlot(schedule, date, "court-2", Date.parse(slotStart(date, 8)))).toEqual({ courtId: "court-2", hour: 8 });
  });
  it("skips occupied and blocked hours and returns no shortcut when all remaining court time is full", () => {
    const bookings = Array.from({ length: 18 }, (_, index) => reservation("court-1", index + 6));
    const blocks = Array.from({ length: 18 }, (_, index) => ({ id: `block-${index}`, courtId: "court-2", startsAt: slotStart(date, index + 6), endsAt: hourEnd(date, index + 7), reason: "Maintenance" }));
    expect(firstAvailableEntrySlot({ ...schedule, bookings: [reservation("court-1", 8)], blocks: [{ id: "block", courtId: "court-2", startsAt: slotStart(date, 6), endsAt: slotStart(date, 7), reason: "Maintenance" }] }, date, "all", Date.parse(slotStart(date, 8)))).toEqual({ courtId: "court-2", hour: 8 });
    expect(firstAvailableEntrySlot({ ...schedule, bookings, blocks }, date, "all", Date.parse(slotStart(date, 5)))).toBeNull();
  });
  it("returns no past-day or after-closing slot", () => {
    expect(firstAvailableEntrySlot(schedule, "2026-10-05", "all", Date.parse(slotStart(date, 8)))).toBeNull();
    expect(firstAvailableEntrySlot(schedule, date, "all", Date.parse(hourEnd(date, 24)))).toBeNull();
  });
});
