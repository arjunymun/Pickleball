import { describe, expect, it } from "vitest";

import { getAvailability, hasCourtConflict, isHoldActive, rangesOverlap } from "../lib/booking/engine";
import type { AdminBlock, Booking, BookingHold, BookableSlot, Court } from "../lib/domain";

const court: Court = {
  id: "court-1",
  name: "Court 01",
  surface: "Outdoor acrylic",
  lighting: true,
  outlook: "East light",
};

const slot: BookableSlot = {
  id: "slot-1",
  templateId: "template-1",
  courtId: court.id,
  startsAt: "2026-05-09T06:00:00+05:30",
  endsAt: "2026-05-09T07:00:00+05:30",
  durationMinutes: 60,
  capacity: 4,
  priceInr: 700,
  paymentMode: "online",
  confirmationMode: "instant",
  availabilityState: "open",
  label: "Sunrise Rally",
};

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    slotId: slot.id,
    venueId: "venue-1",
    courtId: court.id,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    customerId: "customer-1",
    bookedAt: "2026-05-08T09:00:00+05:30",
    status: "confirmed",
    paymentStatus: "paid",
    attendees: 4,
    totalAmountInr: 700,
    ...overrides,
  };
}

function hold(overrides: Partial<BookingHold> = {}): BookingHold {
  return {
    id: "hold-1",
    venueId: "venue-1",
    courtId: court.id,
    customerId: "customer-1",
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    expiresAt: "2026-05-09T05:55:00+05:30",
    status: "active",
    createdAt: "2026-05-09T05:45:00+05:30",
    ...overrides,
  };
}

describe("booking engine", () => {
  it("detects overlapping ranges with checkout-style half-open intervals", () => {
    expect(rangesOverlap(slot.startsAt, slot.endsAt, "2026-05-09T06:30:00+05:30", "2026-05-09T07:30:00+05:30")).toBe(true);
    expect(rangesOverlap(slot.startsAt, slot.endsAt, "2026-05-09T07:00:00+05:30", "2026-05-09T08:00:00+05:30")).toBe(false);
  });

  it("marks a confirmed booking as booked inventory", () => {
    const [result] = getAvailability({
      slots: [slot],
      courts: [court],
      bookings: [booking()],
      now: new Date("2026-05-08T09:00:00+05:30"),
    });

    expect(result.status).toBe("booked");
    expect(result.activeBooking?.id).toBe("booking-1");
  });

  it("marks active holds as unavailable and ignores expired holds", () => {
    expect(isHoldActive(hold(), new Date("2026-05-09T05:50:00+05:30"))).toBe(true);
    expect(isHoldActive(hold(), new Date("2026-05-09T05:56:00+05:30"))).toBe(false);

    const [active] = getAvailability({
      slots: [slot],
      courts: [court],
      bookings: [],
      holds: [hold()],
      now: new Date("2026-05-09T05:50:00+05:30"),
    });

    const [expired] = getAvailability({
      slots: [slot],
      courts: [court],
      bookings: [],
      holds: [hold()],
      now: new Date("2026-05-09T05:56:00+05:30"),
    });

    expect(active.status).toBe("held");
    expect(expired.status).toBe("available");
  });

  it("treats operator blocks as conflicts", () => {
    const block: AdminBlock = {
      id: "block-1",
      venueId: "venue-1",
      courtId: court.id,
      startsAt: "2026-05-09T05:30:00+05:30",
      endsAt: "2026-05-09T06:30:00+05:30",
      reason: "Private lesson",
      createdAt: "2026-05-08T09:00:00+05:30",
    };

    expect(
      hasCourtConflict({
        courtId: court.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        slots: [slot],
        bookings: [],
        adminBlocks: [block],
        now: new Date("2026-05-08T09:00:00+05:30"),
      }),
    ).toBe(true);
  });
});
