import type {
  Booking,
  BookingPaymentStatus,
  BookableSlot,
  CustomerNote,
  WalletLedgerEntry,
} from "@/lib/domain";
import {
  PREVIEW_CUSTOMER_ID,
  adminRoles,
  attendanceEvents,
  bookingPayments,
  bookableSlots,
  bookings,
  courts,
  customerMemberships,
  customerNotes,
  customerPacks,
  customerProfiles,
  membershipPlans,
  offerRedemptions,
  offers,
  packProducts,
  slotTemplates,
  users,
  venue,
  walletLedgerEntries,
} from "@/lib/mock-data";

export const DEMO_STATE_VERSION = 1;

export interface DemoState {
  version: number;
  bookings: Booking[];
  walletLedgerEntries: WalletLedgerEntry[];
  customerNotes: CustomerNote[];
}

export interface DemoMutationResult {
  nextState: DemoState;
  message: string;
}

function cloneBooking(entry: Booking): Booking {
  return { ...entry };
}

function cloneWalletEntry(entry: WalletLedgerEntry): WalletLedgerEntry {
  return { ...entry };
}

function cloneCustomerNote(entry: CustomerNote): CustomerNote {
  return { ...entry };
}

export function createSeedDemoState(): DemoState {
  return {
    version: DEMO_STATE_VERSION,
    bookings: bookings.map(cloneBooking),
    walletLedgerEntries: walletLedgerEntries.map(cloneWalletEntry),
    customerNotes: customerNotes.map(cloneCustomerNote),
  };
}

export function getSlotById(slotId: string) {
  return bookableSlots.find((slot) => slot.id === slotId);
}

export function getCustomerById(customerId: string) {
  return customerProfiles.find((profile) => profile.id === customerId);
}

export function getUserByCustomerId(customerId: string) {
  const profile = getCustomerById(customerId);
  return users.find((user) => user.id === profile?.userId);
}

export function getWalletBalance(state: DemoState, customerId: string) {
  return state.walletLedgerEntries
    .filter((entry) => entry.customerId === customerId)
    .reduce((total, entry) => total + entry.amountInr, 0);
}

export function getBlockingBookingForSlot(state: DemoState, slotId: string) {
  return state.bookings.find(
    (booking) =>
      booking.slotId === slotId && ["requested", "confirmed"].includes(booking.status),
  );
}

export function getUpcomingBookingsForCustomer(state: DemoState, customerId: string) {
  return state.bookings
    .filter(
      (booking) =>
        booking.customerId === customerId && ["requested", "confirmed"].includes(booking.status),
    )
    .map((booking) => ({
      booking,
      slot: getSlotById(booking.slotId)!,
    }))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );
}

export function getCustomerExperience(state: DemoState, customerId = PREVIEW_CUSTOMER_ID) {
  const profile = getCustomerById(customerId)!;
  const user = getUserByCustomerId(customerId)!;
  const pack = customerPacks.find((entry) => entry.customerId === customerId) ?? null;
  const membership = customerMemberships.find((entry) => entry.customerId === customerId) ?? null;
  const walletEntries = state.walletLedgerEntries
    .filter((entry) => entry.customerId === customerId)
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );

  const slots = bookableSlots.map((slot) => {
    const blockingBooking = getBlockingBookingForSlot(state, slot.id);
    const isOwnedByCustomer = blockingBooking?.customerId === customerId;
    const walletBalance = getWalletBalance(state, customerId);
    const canUseWallet = walletBalance >= slot.priceInr && slot.paymentMode !== "pay_at_venue";

    let cta = "Booked";
    if (isOwnedByCustomer) {
      cta = "Your booking";
    } else if (!blockingBooking && slot.confirmationMode === "review") {
      cta = "Request hold";
    } else if (!blockingBooking && canUseWallet) {
      cta = "Book with credits";
    } else if (!blockingBooking) {
      cta = "Book now";
    }

    return {
      slot,
      blockingBooking,
      isOwnedByCustomer,
      canBook: !blockingBooking,
      canUseWallet,
      cta,
    };
  });

  return {
    profile,
    user,
    walletBalance: getWalletBalance(state, customerId),
    walletEntries,
    pack: pack ? packProducts.find((entry) => entry.id === pack.productId) ?? null : null,
    packSnapshot: pack,
    membership: membership ? membershipPlans.find((entry) => entry.id === membership.planId) ?? null : null,
    membershipSnapshot: membership,
    upcomingBookings: getUpcomingBookingsForCustomer(state, customerId),
    slots,
  };
}

export type CustomerExperienceSnapshot = ReturnType<typeof getCustomerExperience>;

export function getAdminDashboard(state: DemoState) {
  const confirmedOrCompleted = state.bookings.filter((booking) =>
    ["confirmed", "completed"].includes(booking.status),
  );

  const repeatPlayCount = customerProfiles.filter(
    (profile) => state.bookings.filter((booking) => booking.customerId === profile.id).length > 1,
  ).length;

  const creditsExpiringSoon = customerPacks.filter((pack) => {
    const expiresAt = new Date(pack.expiresAt).getTime();
    const now = new Date("2026-04-02T08:00:00+05:30").getTime();
    return expiresAt - now < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const requestQueue = state.bookings
    .filter((booking) => booking.status === "requested")
    .map((booking) => ({
      booking,
      slot: getSlotById(booking.slotId)!,
      customer: getUserByCustomerId(booking.customerId)!,
    }))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );

  const upcomingConfirmed = state.bookings
    .filter((booking) => booking.status === "confirmed")
    .map((booking) => ({
      booking,
      slot: getSlotById(booking.slotId)!,
      customer: getUserByCustomerId(booking.customerId)!,
    }))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );

  const schedule = bookableSlots.map((slot) => {
    const blockingBooking = getBlockingBookingForSlot(state, slot.id) ?? null;

    return {
      slot,
      blockingBooking,
      effectiveAvailability: blockingBooking ? "booked" : slot.availabilityState,
      customerName: blockingBooking ? getUserByCustomerId(blockingBooking.customerId)?.name ?? "Sideout player" : null,
      court: courts.find((court) => court.id === slot.courtId) ?? null,
    };
  });

  const atRiskCustomers = customerProfiles
    .map((profile) => {
      const lastAttendance = attendanceEvents
        .filter((event) => event.customerId === profile.id)
        .map((event) => new Date(event.attendedAt).getTime())
        .sort((first, second) => second - first)[0];

      const hasUpcomingBooking = state.bookings.some(
        (booking) =>
          booking.customerId === profile.id &&
          ["requested", "confirmed"].includes(booking.status),
      );

      return {
        profile,
        user: getUserByCustomerId(profile.id)!,
        daysSinceLastAttendance: lastAttendance
          ? Math.floor(
              (new Date("2026-04-02T08:00:00+05:30").getTime() - lastAttendance) /
                (24 * 60 * 60 * 1000),
            )
          : 99,
        note: state.customerNotes.find((entry) => entry.customerId === profile.id) ?? null,
        hasUpcomingBooking,
      };
    })
    .filter((entry) => entry.daysSinceLastAttendance >= 7 && !entry.hasUpcomingBooking)
    .sort((first, second) => second.daysSinceLastAttendance - first.daysSinceLastAttendance)
    .slice(0, 4);

  const customers = customerProfiles.map((profile) => {
    const user = getUserByCustomerId(profile.id)!;
    const membership = customerMemberships.find((entry) => entry.customerId === profile.id);
    const membershipName = membership
      ? membershipPlans.find((entry) => entry.id === membership.planId)?.name ?? "Membership"
      : "No membership";
    const nextBooking = getUpcomingBookingsForCustomer(state, profile.id)[0] ?? null;
    const lastAttendance = attendanceEvents
      .filter((event) => event.customerId === profile.id)
      .map((event) => new Date(event.attendedAt).getTime())
      .sort((first, second) => second - first)[0];

    return {
      id: profile.id,
      name: user.name,
      favoriteWindow: profile.favoriteWindow,
      totalBookings: state.bookings.filter((booking) => booking.customerId === profile.id).length,
      membership: membershipName,
      creditsRemaining: getWalletBalance(state, profile.id),
      tags: profile.tags,
      note: state.customerNotes.find((entry) => entry.customerId === profile.id) ?? null,
      nextBooking,
      daysSinceLastAttendance: lastAttendance
        ? Math.floor(
            (new Date("2026-04-02T08:00:00+05:30").getTime() - lastAttendance) /
              (24 * 60 * 60 * 1000),
          )
        : 99,
    };
  });

  return {
    venue,
    courts,
    slotTemplates,
    adminRoles,
    offers,
    metrics: {
      repeatPlayRate: (repeatPlayCount / customerProfiles.length) * 100,
      occupancyRate: (confirmedOrCompleted.length / bookableSlots.length) * 100,
      creditsExpiringSoon,
      offersRedeemed: offerRedemptions.length,
    },
    schedule,
    requestQueue,
    upcomingConfirmed,
    atRiskCustomers,
    customers,
  };
}

export type AdminDashboardSnapshot = ReturnType<typeof getAdminDashboard>;

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`}`;
}

function getBookingValueInr(booking: Booking) {
  return bookingPayments.find((entry) => entry.bookingId === booking.id)?.amountInr ?? getSlotById(booking.slotId)?.priceInr ?? 0;
}

function getPaymentStatusForBooking(
  slot: BookableSlot,
  status: Booking["status"],
  useWallet: boolean,
): BookingPaymentStatus {
  if (slot.paymentMode === "pay_at_venue") {
    return "pay_at_venue";
  }

  if (useWallet) {
    return "credit_applied";
  }

  if (status === "requested") {
    return "pending";
  }

  return "paid_online";
}

export function bookSlot(
  state: DemoState,
  slotId: string,
  customerId = PREVIEW_CUSTOMER_ID,
): DemoMutationResult {
  const slot = getSlotById(slotId);
  if (!slot) {
    throw new Error("Slot not found.");
  }

  if (getBlockingBookingForSlot(state, slotId)) {
    throw new Error("That slot is already unavailable.");
  }

  const useWallet = getWalletBalance(state, customerId) >= slot.priceInr && slot.paymentMode !== "pay_at_venue";
  const nextStatus: Booking["status"] = slot.confirmationMode === "review" ? "requested" : "confirmed";
  const paymentStatus = getPaymentStatusForBooking(slot, nextStatus, useWallet);

  const nextBookings = [
    ...state.bookings,
    {
      id: createId("booking"),
      slotId,
      customerId,
      bookedAt: new Date().toISOString(),
      status: nextStatus,
      paymentStatus,
      attendees: 4,
    },
  ];

  const nextWalletEntries = useWallet
    ? [
        ...state.walletLedgerEntries,
        {
          id: createId("wallet"),
          customerId,
          createdAt: new Date().toISOString(),
          amountInr: -slot.priceInr,
          kind: "credit_spent" as const,
          note: `Applied to ${slot.label}`,
        },
      ]
    : state.walletLedgerEntries;

  const message =
    nextStatus === "requested"
      ? `${slot.label} requested. Staff will review this hold before it is confirmed.`
      : useWallet
        ? `${slot.label} confirmed using venue credits.`
        : `${slot.label} confirmed and marked for ${slot.paymentMode === "pay_at_venue" ? "venue settlement" : "online payment"}.`;

  return {
    nextState: {
      ...state,
      bookings: nextBookings,
      walletLedgerEntries: nextWalletEntries,
    },
    message,
  };
}

export function cancelBooking(
  state: DemoState,
  bookingId: string,
  actorLabel = "Customer",
): DemoMutationResult {
  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!["requested", "confirmed"].includes(booking.status)) {
    throw new Error("Only live bookings can be canceled in the demo.");
  }

  const slot = getSlotById(booking.slotId)!;
  const nextBookings = state.bookings.map((entry) =>
    entry.id === bookingId ? { ...entry, status: "canceled" as const } : entry,
  );

  const shouldCreditBack = ["paid_online", "credit_applied"].includes(booking.paymentStatus);
  const nextWalletEntries = shouldCreditBack
    ? [
        ...state.walletLedgerEntries,
        {
          id: createId("wallet"),
          customerId: booking.customerId,
          createdAt: new Date().toISOString(),
          amountInr: getBookingValueInr(booking),
          kind: "refund_credit" as const,
          note: `${actorLabel} cancellation credit for ${slot.label}`,
        },
      ]
    : state.walletLedgerEntries;

  return {
    nextState: {
      ...state,
      bookings: nextBookings,
      walletLedgerEntries: nextWalletEntries,
    },
    message: `${slot.label} canceled. Value returned as venue credit where applicable.`,
  };
}

export function approveBooking(state: DemoState, bookingId: string): DemoMutationResult {
  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.status !== "requested") {
    throw new Error("Only requested bookings can be approved.");
  }

  const slot = getSlotById(booking.slotId)!;

  const nextBookings = state.bookings.map((entry) =>
    entry.id === bookingId
      ? {
          ...entry,
          status: "confirmed" as const,
          paymentStatus:
            entry.paymentStatus === "pending"
              ? getPaymentStatusForBooking(slot, "confirmed", false)
              : entry.paymentStatus,
        }
      : entry,
  );

  return {
    nextState: {
      ...state,
      bookings: nextBookings,
    },
    message: `${slot.label} confirmed from the operator queue.`,
  };
}

export function addWalletCredit(
  state: DemoState,
  customerId: string,
  amountInr: number,
  note: string,
): DemoMutationResult {
  if (amountInr <= 0) {
    throw new Error("Credit amount must be positive.");
  }

  return {
    nextState: {
      ...state,
      walletLedgerEntries: [
        ...state.walletLedgerEntries,
        {
          id: createId("wallet"),
          customerId,
          createdAt: new Date().toISOString(),
          amountInr,
          kind: "manual_adjustment" as const,
          note,
        },
      ],
    },
    message: `Added ${amountInr} INR in venue credit.`,
  };
}
