import { describe, expect, it } from "vitest";
import type { AcademyMembership } from "@/lib/academy/contracts";
import { hourEnd, paidMember, parseRupees, requestKey } from "./operations-utils";

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
