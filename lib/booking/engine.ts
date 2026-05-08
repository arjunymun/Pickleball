import type { AdminBlock, Booking, BookingHold, BookableSlot, Court, PriceRule } from "@/lib/domain";

export type AvailabilityStatus = "available" | "held" | "booked" | "blocked" | "expired";

export interface AvailabilitySlot {
  slot: BookableSlot;
  court: Court | null;
  status: AvailabilityStatus;
  priceInr: number;
  memberPriceInr: number | null;
  activeBooking: Booking | null;
  activeHold: BookingHold | null;
  adminBlock: AdminBlock | null;
  cta: string;
}

export interface AvailabilityInput {
  slots: BookableSlot[];
  courts: Court[];
  bookings: Booking[];
  holds?: BookingHold[];
  adminBlocks?: AdminBlock[];
  priceRules?: PriceRule[];
  date?: string;
  now?: Date;
}

const ACTIVE_BOOKING_STATUSES = new Set<Booking["status"]>([
  "held",
  "payment_pending",
  "requested",
  "confirmed",
  "checked_in",
]);

function getRangeStart(entry: Pick<BookableSlot, "startsAt"> | Pick<Booking, "startsAt" | "slotId">, slot?: BookableSlot) {
  return "startsAt" in entry && entry.startsAt ? entry.startsAt : slot?.startsAt ?? "";
}

function getRangeEnd(entry: Pick<BookableSlot, "endsAt"> | Pick<Booking, "endsAt" | "slotId">, slot?: BookableSlot) {
  return "endsAt" in entry && entry.endsAt ? entry.endsAt : slot?.endsAt ?? "";
}

export function rangesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return new Date(firstStart).getTime() < new Date(secondEnd).getTime() &&
    new Date(secondStart).getTime() < new Date(firstEnd).getTime();
}

export function isHoldActive(hold: BookingHold, now = new Date()) {
  return hold.status === "active" && new Date(hold.expiresAt).getTime() > now.getTime();
}

function findMatchingPriceRule(slot: BookableSlot, priceRules: PriceRule[]) {
  const slotStart = new Date(slot.startsAt);
  const dayOfWeek = slotStart.getDay();
  const time = slot.startsAt.slice(11, 16);

  return [...priceRules]
    .filter((rule) => rule.dayOfWeek === null || rule.dayOfWeek === dayOfWeek)
    .filter((rule) => rule.startsAt <= time && time < rule.endsAt)
    .sort((first, second) => second.priority - first.priority)[0] ?? null;
}

export function getAvailability(input: AvailabilityInput): AvailabilitySlot[] {
  const now = input.now ?? new Date();
  const courtById = new Map(input.courts.map((court) => [court.id, court]));
  const datePrefix = input.date;

  return input.slots
    .filter((slot) => !datePrefix || slot.startsAt.slice(0, 10) === datePrefix)
    .map((slot) => {
      const activeBooking =
        input.bookings.find((booking) => {
          const bookingSlot = input.slots.find((candidate) => candidate.id === booking.slotId);
          const bookingCourtId = booking.courtId ?? bookingSlot?.courtId;
          if (bookingCourtId !== slot.courtId || !ACTIVE_BOOKING_STATUSES.has(booking.status)) {
            return false;
          }

          return rangesOverlap(
            getRangeStart(booking, bookingSlot),
            getRangeEnd(booking, bookingSlot),
            slot.startsAt,
            slot.endsAt,
          );
        }) ?? null;

      const activeHold =
        (input.holds ?? []).find(
          (hold) =>
            hold.courtId === slot.courtId &&
            isHoldActive(hold, now) &&
            rangesOverlap(hold.startsAt, hold.endsAt, slot.startsAt, slot.endsAt),
        ) ?? null;

      const adminBlock =
        (input.adminBlocks ?? []).find(
          (block) =>
            block.courtId === slot.courtId &&
            rangesOverlap(block.startsAt, block.endsAt, slot.startsAt, slot.endsAt),
        ) ?? null;

      const priceRule = findMatchingPriceRule(slot, input.priceRules ?? []);
      const status: AvailabilityStatus = adminBlock
        ? "blocked"
        : activeBooking
          ? "booked"
          : activeHold
            ? "held"
            : new Date(slot.endsAt).getTime() <= now.getTime()
              ? "expired"
              : "available";

      return {
        slot,
        court: courtById.get(slot.courtId) ?? null,
        status,
        priceInr: priceRule?.priceInr ?? slot.priceInr,
        memberPriceInr: priceRule?.memberPriceInr ?? null,
        activeBooking,
        activeHold,
        adminBlock,
        cta:
          status === "available"
            ? slot.paymentMode === "pay_at_venue"
              ? "Request hold"
              : "Hold and checkout"
            : status === "held"
              ? "Temporarily held"
              : status === "blocked"
                ? "Blocked by venue"
                : status === "expired"
                  ? "Window passed"
                  : "Booked",
      };
    })
    .sort((first, second) => new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime());
}

export function hasCourtConflict(input: {
  courtId: string;
  startsAt: string;
  endsAt: string;
  slots: BookableSlot[];
  bookings: Booking[];
  holds?: BookingHold[];
  adminBlocks?: AdminBlock[];
  now?: Date;
}) {
  return getAvailability({
    slots: [
      {
        id: "candidate",
        templateId: "candidate",
        courtId: input.courtId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        durationMinutes: Math.round((new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime()) / 60000),
        capacity: 4,
        priceInr: 0,
        paymentMode: "online",
        confirmationMode: "instant",
        availabilityState: "open",
        label: "Candidate hold",
      },
    ],
    courts: [],
    bookings: input.bookings,
    holds: input.holds,
    adminBlocks: input.adminBlocks,
    now: input.now,
  })[0]?.status !== "available";
}
