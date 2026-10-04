import { describe, expect, it } from "vitest";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import { addDays, bookingDates, hourInIndia, indiaDate, isValidDate, slotStart } from "@/lib/academy/time";

describe("academy calendar boundaries", () => {
  it("uses the venue day when UTC is still on the previous date", () => {
    expect(indiaDate("2026-10-02T20:00:00Z")).toBe("2026-10-03");
    expect(indiaDate("2026-10-02T18:29:59Z")).toBe("2026-10-02");
    expect(indiaDate("2026-10-02T18:30:00Z")).toBe("2026-10-03");
  });
  it("generates exactly fourteen calendar days across a year boundary", () => {
    const dates = bookingDates(new Date("2026-12-31T08:00:00Z"));
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe("2026-12-31");
    expect(dates.at(-1)).toBe("2027-01-13");
    expect(new Set(dates).size).toBe(14);
  });
  it("rejects nonexistent dates rather than normalizing a booking into another day", () => {
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2026-04-31")).toBe(false);
    expect(() => slotStart("2026-04-31", 6)).toThrow();
    expect(() => slotStart("2026-10-03", 24)).toThrow();
    expect(() => slotStart("2026-10-03", 6.5)).toThrow();
  });
  it("represents the final court hour ending at local midnight", () => {
    const start = slotStart("2026-10-03", 23);
    const end = new Date(new Date(start).getTime() + 3_600_000).toISOString();
    expect(hourInIndia(start)).toBe(23);
    expect(hourInIndia(end)).toBe(0);
    expect(indiaDate(end)).toBe("2026-10-04");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("published pricing", () => {
  it("keeps per-person play and court hire as distinct products", () => {
    expect(ACADEMY.courtPricePaise).toBe(50_000);
    expect(ACADEMY.memberCourtPricePaise).toBe(40_000);
    expect(ACADEMY.individualPricePaise).toBe(12_500);
    expect(ACADEMY.membershipPricePaise).toBe(250_000);
    expect(formatMoney(ACADEMY.membershipPricePaise)).toBe("₹2,500");
    expect(formatMoney(12_550)).toBe("₹125.50");
  });
});
