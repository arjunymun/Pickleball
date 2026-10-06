import type { AcademySlot } from "@/lib/academy/contracts";
import { ACADEMY } from "@/lib/academy/config";
import { bookingDates, slotStart } from "@/lib/academy/time";

export function chosenAvailableSlot(
  slots: AcademySlot[],
  selectedCourtId: string,
): AcademySlot | undefined {
  if (selectedCourtId)
    return slots.find(
      (slot) => slot.courtId === selectedCourtId && slot.available,
    );
  return slots.find((slot) => slot.available);
}

export function slotStartsInFuture(
  startsAt: string,
  now = Date.now(),
): boolean {
  return Date.parse(startsAt) > now;
}

export function nextCourtStart(
  now = Date.now(),
  requestedDate?: string,
): { date: string; hour: string } | null {
  const days = requestedDate ? [requestedDate] : bookingDates(new Date(now));
  for (const date of days) {
    for (let hour = ACADEMY.openingHour; hour < ACADEMY.closingHour; hour++) {
      if (slotStartsInFuture(slotStart(date, hour), now))
        return { date, hour: String(hour) };
    }
  }
  return null;
}

export function resolveBookingSelection(
  now: number,
  requestedDate?: string | null,
  requestedHour?: string | null,
) {
  const dates = bookingDates(new Date(now));
  const validDate = Boolean(requestedDate && dates.includes(requestedDate));
  const validHour = Boolean(
    requestedHour &&
      /^\d{1,2}$/.test(requestedHour) &&
      Number(requestedHour) >= ACADEMY.openingHour &&
      Number(requestedHour) < ACADEMY.closingHour,
  );
  const date = validDate
    ? requestedDate!
    : requestedDate || requestedHour
      ? dates[0]
      : (nextCourtStart(now)?.date ?? dates[0]);
  const hour = validHour
    ? String(Number(requestedHour))
    : (nextCourtStart(now, date)?.hour ?? String(ACADEMY.closingHour - 1));
  const invalid = Boolean(
    (requestedDate && !validDate) || (requestedHour && !validHour),
  );
  const notice = invalid
    ? "That date or time is outside the booking options. Choose from the dates and times shown."
    : !slotStartsInFuture(slotStart(date, Number(hour)), now)
      ? "That requested start time has passed. Choose a later time or another date."
      : null;
  return { date, hour, notice };
}
