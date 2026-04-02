import type {
  Booking,
  BookingPaymentStatus,
  BookableSlot,
  CommunicationDelivery,
  CommunicationTemplate,
  CustomerNote,
  OperatorActivityLog,
  VenueSettings,
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
  venueSettings: VenueSettings;
  operatorActivity: OperatorActivityLog[];
  communicationDeliveries: CommunicationDelivery[];
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

function cloneVenueSettings(entry: VenueSettings): VenueSettings {
  return {
    ...entry,
    reminderLeadHours: [...entry.reminderLeadHours],
  };
}

function cloneOperatorActivity(entry: OperatorActivityLog): OperatorActivityLog {
  return { ...entry };
}

function cloneCommunicationDelivery(entry: CommunicationDelivery): CommunicationDelivery {
  return { ...entry };
}

export function createSeedDemoState(): DemoState {
  return {
    version: DEMO_STATE_VERSION,
    bookings: bookings.map(cloneBooking),
    walletLedgerEntries: walletLedgerEntries.map(cloneWalletEntry),
    customerNotes: customerNotes.map(cloneCustomerNote),
    venueSettings: cloneVenueSettings(demoVenueSettings),
    operatorActivity: demoOperatorActivity.map(cloneOperatorActivity),
    communicationDeliveries: demoCommunicationDeliveries.map(cloneCommunicationDelivery),
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

export function getCommercialCatalog() {
  return {
    offers: offers.map((offer) => ({ ...offer })),
    packProducts: packProducts.map((pack) => ({ ...pack })),
    membershipPlans: membershipPlans.map((plan) => ({
      ...plan,
      perks: [...plan.perks],
    })),
  };
}

export type CommercialCatalogSnapshot = ReturnType<typeof getCommercialCatalog>;

const demoVenueSettings: VenueSettings = {
  id: "demo-venue-settings",
  venueId: venue.id,
  cancellationCutoffHours: 6,
  bookingWindowDays: 14,
  reminderLeadHours: [24, 2],
  publicContactPhone: "+91 98765 43110",
  publicContactEmail: "play@sideout.club",
  publicWhatsappNumber: "+91 98765 43110",
  memberDiscountPercent: 10,
  featuredAnnouncement: "Sunrise inventory is the cleanest place to win back off-rhythm regulars.",
};

const demoOperatorActivity: OperatorActivityLog[] = [
  {
    id: "activity-001",
    venueId: venue.id,
    actorUserId: users[0]?.id ?? null,
    customerId: PREVIEW_CUSTOMER_ID,
    bookingId: bookings[0]?.id ?? null,
    action: "credit_added",
    detail: "Recovery credit added for a lapsed sunrise regular.",
    createdAt: "2026-04-01T18:20:00+05:30",
  },
  {
    id: "activity-002",
    venueId: venue.id,
    actorUserId: users[0]?.id ?? null,
    customerId: PREVIEW_CUSTOMER_ID,
    bookingId: bookings[0]?.id ?? null,
    action: "booking_approved",
    detail: "Coach hold approved from the operator queue.",
    createdAt: "2026-04-01T16:05:00+05:30",
  },
  {
    id: "activity-003",
    venueId: venue.id,
    actorUserId: users[0]?.id ?? null,
    customerId: customerProfiles[1]?.id ?? null,
    bookingId: null,
    action: "whatsapp_sent",
    detail: "Sunrise recovery nudge delivered through WhatsApp.",
    createdAt: "2026-03-31T19:45:00+05:30",
  },
];

const demoCommunicationTemplates: CommunicationTemplate[] = [
  {
    id: "template-booking-confirmation",
    venueId: venue.id,
    slug: "booking-confirmation",
    channel: "whatsapp",
    title: "Booking confirmation",
    body: "You are confirmed for {{slot_label}} on {{slot_date}}. Reply if you need to release the court before cutoff.",
  },
  {
    id: "template-review-approved",
    venueId: venue.id,
    slug: "review-approved",
    channel: "whatsapp",
    title: "Review hold approved",
    body: "Your request for {{slot_label}} has been approved. We will hold the court for you.",
  },
  {
    id: "template-sunrise-recovery",
    venueId: venue.id,
    slug: "sunrise-recovery",
    channel: "whatsapp",
    title: "Sunrise recovery",
    body: "We dropped a small recovery credit into your wallet for a sunrise session this week.",
  },
  {
    id: "template-membership-renewal",
    venueId: venue.id,
    slug: "membership-renewal",
    channel: "whatsapp",
    title: "Membership renewal",
    body: "Your Sideout membership renews soon. We will keep your member pricing and monthly credits active after renewal.",
  },
];

const demoCommunicationDeliveries: CommunicationDelivery[] = [
  {
    id: "delivery-001",
    venueId: venue.id,
    customerId: PREVIEW_CUSTOMER_ID,
    bookingId: bookings[0]?.id ?? null,
    templateId: "template-booking-confirmation",
    channel: "whatsapp",
    direction: "outbound",
    status: "delivered",
    provider: "twilio_whatsapp",
    providerMessageId: "demo-msg-001",
    body: "You are confirmed for Sunrise Rally tomorrow.",
    sentAt: "2026-04-01T18:25:00+05:30",
  },
  {
    id: "delivery-002",
    venueId: venue.id,
    customerId: customerProfiles[1]?.id ?? PREVIEW_CUSTOMER_ID,
    bookingId: null,
    templateId: "template-sunrise-recovery",
    channel: "whatsapp",
    direction: "outbound",
    status: "sent",
    provider: "twilio_whatsapp",
    providerMessageId: "demo-msg-002",
    body: "We dropped a sunrise recovery credit into your wallet.",
    sentAt: "2026-04-01T09:10:00+05:30",
  },
];

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
      phone: profile.phoneE164 ?? user.phone,
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
      lastContactedAt: profile.lastContactedAt ?? null,
      communicationPreference: profile.communicationPreference ?? "whatsapp",
    };
  });

  return {
    venue,
    venueSettings: state.venueSettings,
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
    operatorActivity: state.operatorActivity,
    communicationTemplates: demoCommunicationTemplates,
    communicationDeliveries: state.communicationDeliveries,
    customerSegments: {
      inactivePlayers: atRiskCustomers.length,
      expiringPackValue: creditsExpiringSoon,
      upcomingRenewals: customerMemberships.filter((entry) => entry.status === "active").length,
      noShowRisk: state.bookings.filter((booking) => booking.status === "no_show").length,
    },
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

function pushOperatorActivity(
  state: DemoState,
  action: string,
  detail: string,
  customerId: string | null,
  bookingId: string | null,
) {
  return [
    {
      id: createId("activity"),
      venueId: venue.id,
      actorUserId: users[0]?.id ?? null,
      customerId,
      bookingId,
      action,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...state.operatorActivity,
  ];
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

  const createdBooking: Booking = {
    id: createId("booking"),
    slotId,
    customerId,
    bookedAt: new Date().toISOString(),
    status: nextStatus,
    paymentStatus,
    attendees: 4,
    confirmedAt: nextStatus === "confirmed" ? new Date().toISOString() : null,
    checkedInAt: null,
    completedAt: null,
    noShowMarkedAt: null,
    canceledAt: null,
    creditedAt: null,
  };

  const nextBookings = [
    ...state.bookings,
    createdBooking,
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
      operatorActivity: pushOperatorActivity(
        state,
        nextStatus === "requested" ? "booking_requested" : "booking_created",
        `${slot.label} ${nextStatus === "requested" ? "requested for operator review" : "confirmed from the customer surface"}.`,
        customerId,
        createdBooking.id,
      ),
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
    entry.id === bookingId
      ? { ...entry, status: "canceled" as const, canceledAt: new Date().toISOString() }
      : entry,
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
      operatorActivity: pushOperatorActivity(
        state,
        actorLabel === "Customer" ? "booking_canceled" : "operator_canceled_booking",
        `${actorLabel} canceled ${slot.label}.`,
        booking.customerId,
        booking.id,
      ),
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
          confirmedAt: new Date().toISOString(),
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
      operatorActivity: pushOperatorActivity(
        state,
        "booking_approved",
        `${slot.label} confirmed from the operator queue.`,
        booking.customerId,
        booking.id,
      ),
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
      operatorActivity: pushOperatorActivity(
        state,
        "credit_added",
        note,
        customerId,
        null,
      ),
    },
    message: `Added ${amountInr} INR in venue credit.`,
  };
}

export function checkInBooking(state: DemoState, bookingId: string): DemoMutationResult {
  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!["confirmed", "checked_in"].includes(booking.status)) {
    throw new Error("Only confirmed bookings can be checked in.");
  }

  const slot = getSlotById(booking.slotId)!;

  return {
    nextState: {
      ...state,
      bookings: state.bookings.map((entry) =>
        entry.id === bookingId
          ? {
              ...entry,
              status: "checked_in",
              checkedInAt: entry.checkedInAt ?? new Date().toISOString(),
            }
          : entry,
      ),
      operatorActivity: pushOperatorActivity(
        state,
        "booking_checked_in",
        `${slot.label} checked in from the operator board.`,
        booking.customerId,
        booking.id,
      ),
    },
    message: `${slot.label} checked in.`,
  };
}

export function completeBooking(state: DemoState, bookingId: string): DemoMutationResult {
  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!["confirmed", "checked_in"].includes(booking.status)) {
    throw new Error("Only active bookings can be completed.");
  }

  const slot = getSlotById(booking.slotId)!;

  return {
    nextState: {
      ...state,
      bookings: state.bookings.map((entry) =>
        entry.id === bookingId
          ? {
              ...entry,
              status: "completed",
              completedAt: new Date().toISOString(),
            }
          : entry,
      ),
      operatorActivity: pushOperatorActivity(
        state,
        "booking_completed",
        `${slot.label} marked completed.`,
        booking.customerId,
        booking.id,
      ),
    },
    message: `${slot.label} marked completed.`,
  };
}

export function markBookingNoShow(state: DemoState, bookingId: string): DemoMutationResult {
  const booking = state.bookings.find((entry) => entry.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!["confirmed", "checked_in"].includes(booking.status)) {
    throw new Error("Only active bookings can be marked no-show.");
  }

  const slot = getSlotById(booking.slotId)!;

  return {
    nextState: {
      ...state,
      bookings: state.bookings.map((entry) =>
        entry.id === bookingId
          ? {
              ...entry,
              status: "no_show",
              noShowMarkedAt: new Date().toISOString(),
            }
          : entry,
      ),
      operatorActivity: pushOperatorActivity(
        state,
        "booking_no_show",
        `${slot.label} marked as no-show.`,
        booking.customerId,
        booking.id,
      ),
    },
    message: `${slot.label} marked as no-show.`,
  };
}

export function addCustomerNote(state: DemoState, customerId: string, body: string): DemoMutationResult {
  if (!body.trim()) {
    throw new Error("Note body is required.");
  }

  return {
    nextState: {
      ...state,
      customerNotes: [
        {
          id: createId("note"),
          customerId,
          authoredBy: "Sideout operator",
          createdAt: new Date().toISOString(),
          body: body.trim(),
        },
        ...state.customerNotes,
      ],
      operatorActivity: pushOperatorActivity(
        state,
        "customer_note_added",
        body.trim(),
        customerId,
        null,
      ),
    },
    message: "Customer note added.",
  };
}

export function updateVenueSettings(
  state: DemoState,
  patch: Partial<VenueSettings>,
): DemoMutationResult {
  const nextSettings = {
    ...state.venueSettings,
    ...patch,
    reminderLeadHours: patch.reminderLeadHours ?? state.venueSettings.reminderLeadHours,
  };

  return {
    nextState: {
      ...state,
      venueSettings: nextSettings,
      operatorActivity: pushOperatorActivity(
        state,
        "venue_settings_updated",
        "Venue settings updated from the operator settings surface.",
        null,
        null,
      ),
    },
    message: "Venue settings updated.",
  };
}

export function sendCommunication(
  state: DemoState,
  customerId: string,
  templateId: string,
  body: string,
): DemoMutationResult {
  return {
    nextState: {
      ...state,
      communicationDeliveries: [
        {
          id: createId("delivery"),
          venueId: venue.id,
          customerId,
          bookingId: null,
          templateId,
          channel: "whatsapp",
          direction: "outbound",
          status: "sent",
          provider: "twilio_whatsapp",
          providerMessageId: createId("provider"),
          body,
          sentAt: new Date().toISOString(),
        },
        ...state.communicationDeliveries,
      ],
      operatorActivity: pushOperatorActivity(
        state,
        "whatsapp_sent",
        body,
        customerId,
        null,
      ),
    },
    message: "WhatsApp message queued in the Sideout demo flow.",
  };
}
