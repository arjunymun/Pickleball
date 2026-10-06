import { expect, it } from "vitest";
import type { AcademySlot } from "@/lib/academy/contracts";
import {
  chosenAvailableSlot,
  nextCourtStart,
  slotStartsInFuture,
  resolveBookingSelection,
} from "@/components/customer/booking-selection";

const slots: AcademySlot[] = [
  {
    id: "court-1-slot",
    courtId: "court-1",
    startsAt: "2026-10-08T04:30:00.000Z",
    endsAt: "2026-10-08T05:30:00.000Z",
    available: true,
    pricePaise: 50_000,
  },
  {
    id: "court-2-slot",
    courtId: "court-2",
    startsAt: "2026-10-08T04:30:00.000Z",
    endsAt: "2026-10-08T05:30:00.000Z",
    available: true,
    pricePaise: 50_000,
  },
];

it("does not switch courts when the selected court is unavailable", () => {
  const changedAvailability = [{ ...slots[0], available: false }, slots[1]];
  expect(chosenAvailableSlot(changedAvailability, "court-1")).toBeUndefined();
});

it("restores an empty URL to a future default after the last start", () => {
  expect(
    resolveBookingSelection(
      Date.parse("2026-10-08T23:30:00+05:30"),
      null,
      null,
    ),
  ).toEqual({ date: "2026-10-09", hour: "6", notice: null });
});

it("preserves explicit elapsed intent and explains invalid saved selections", () => {
  const now = Date.parse("2026-10-08T20:30:00+05:30");
  expect(resolveBookingSelection(now, "2026-10-08", "18")).toMatchObject({
    date: "2026-10-08",
    hour: "18",
    notice: expect.stringContaining("has passed"),
  });
  expect(resolveBookingSelection(now, "2026-10-01", "99")).toMatchObject({
    date: "2026-10-08",
    hour: "21",
    notice: expect.stringContaining("outside the booking options"),
  });
  expect(resolveBookingSelection(now, "2026-10-09", "06")).toEqual({
    date: "2026-10-09",
    hour: "6",
    notice: null,
  });
});

it("chooses the first available court when no court was selected", () => {
  expect(chosenAvailableSlot(slots, "")?.courtId).toBe("court-1");
});

it("marks a slot unavailable after its start time", () => {
  expect(
    slotStartsInFuture(
      "2026-10-08T04:30:00.000Z",
      Date.parse("2026-10-08T04:31:00.000Z"),
    ),
  ).toBe(false);
});

it("defaults to the next future court start and rolls to tomorrow after the last start", () => {
  const atSevenThirty = Date.parse("2026-10-08T07:30:00+05:30");
  expect(nextCourtStart(atSevenThirty)).toEqual({
    date: "2026-10-08",
    hour: "8",
  });

  const afterEleven = Date.parse("2026-10-08T23:01:00+05:30");
  expect(nextCourtStart(afterEleven)).toEqual({
    date: "2026-10-09",
    hour: "6",
  });
});
