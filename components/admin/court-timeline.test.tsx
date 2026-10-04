import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AcademyBooking, AdminSchedulePayload } from "@/lib/academy/contracts";
import { slotStart } from "@/lib/academy/time";
import { CourtTimeline } from "./court-timeline";

const date = "2026-10-03";
const now = Date.parse("2026-10-03T01:00:00Z");
const courts = Array.from({ length: 4 }, (_, index) => ({ id: `court-${index + 1}`, name: `Court ${index + 1}`, number: index + 1 }));
const payload: AdminSchedulePayload = { date, courts, bookings: [], blocks: [], metrics: { bookingCount: 0, collectedPaise: 0, refundedPaise: 0, occupiedHours: 0 }, paymentMode: "test" };
function booking(status: AcademyBooking["status"]): AcademyBooking {
  return { id: "reservation", courtId: "court-1", courtName: "Court 1", customerId: "test-player", customerName: "Player Test", startsAt: slotStart(date, 6), endsAt: slotStart(date, 7), status, paymentStatus: "paid", amountPaise: 50000, refundedPaise: 0, holdExpiresAt: null, source: "online", reference: null, reason: null, createdAt: "2026-10-02T00:00:00Z" };
}
function render(overrides: Partial<AdminSchedulePayload> = {}, locked = false, clock = now) {
  return renderToStaticMarkup(<CourtTimeline payload={{ ...payload, ...overrides }} date={date} courts={courts} locked={locked} now={clock} onBooking={() => undefined} onBlock={() => undefined} onOpen={() => undefined} />);
}
describe("staff day timeline", () => {
  it("renders four named courts and all 18 operating hours as accessible table rows", () => {
    const html = render();
    expect(html).toContain('role="table"');
    expect(html.match(/role="rowheader"/g)).toHaveLength(18);
    for (const court of courts) expect(html).toContain(court.name);
    expect(html).toContain("06:00"); expect(html).toContain("23:00");
  });
  it.each(["held", "confirmed", "checked_in", "completed", "no_show"] as const)("keeps %s reservations visible and protects their court-hour", (status) => {
    const html = render({ bookings: [booking(status)] });
    expect(html).toContain("Player Test");
    expect(html).toContain(status.replaceAll("_", " "));
    expect(html).not.toContain('aria-label="Add reservation on Court 1 at 6:00');
    expect(html).toContain('aria-label="Add reservation on Court 2 at 6:00');
  });
  it.each(["cancelled", "expired"] as const)("retains historical %s records while releasing inventory", (status) => {
    const html = render({ bookings: [booking(status)] });
    expect(html).toContain("Player Test");
    expect(html).toContain('aria-label="Add reservation on Court 1 at 6:00');
  });
  it("shows a multi-hour maintenance block on both hours and allows its end boundary", () => {
    const html = render({ blocks: [{ id: "block", courtId: "court-1", startsAt: slotStart(date, 6), endsAt: slotStart(date, 8), reason: "Court repair" }] });
    expect(html.match(/Court repair/g)).toHaveLength(2);
    expect(html).not.toContain('aria-label="Add reservation on Court 1 at 6:00');
    expect(html).not.toContain('aria-label="Add reservation on Court 1 at 7:00');
    expect(html).toContain('aria-label="Add reservation on Court 1 at 8:00');
  });
  it("locks every action while the latest schedule is unavailable", () => {
    const html = render({ bookings: [booking("confirmed")] }, true);
    const buttons = html.match(/<button\b[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((button) => button.includes('disabled=""'))).toBe(true);
  });
  it("permits current-hour manual entry but disables elapsed hours", () => {
    const current = render();
    expect(current).toMatch(/<button[^>]*aria-label="Add reservation on Court 1 at 6:00[^>]*>/);
    const elapsed = render({}, false, Date.parse(slotStart(date, 7)));
    expect(elapsed).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Add reservation on Court 1 at 6:00[^>]*>/);
  });
});
